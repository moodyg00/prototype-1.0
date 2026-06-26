import {
  createMediaService,
  createStorageAdapter,
  parseLibraryFromStoragePath,
} from '@prototype/media';

import { prisma } from '@/src/lib/prisma';
import { isImageMimeType, type AttachmentListQuery, type AttachmentUploadInput } from '@/src/lib/validation/attachment';

export class AttachmentServiceError extends Error {
  code: 'not_found' | 'invalid_target';
  constructor(code: 'not_found' | 'invalid_target', message: string) {
    super(message);
    this.name = 'AttachmentServiceError';
    this.code = code;
  }
}

export function attachmentServiceErrorStatus(code: AttachmentServiceError['code']): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'invalid_target':
      return 422;
    default:
      return 400;
  }
}

/** Plain, client-safe shape for an attachment. */
export type AttachmentSummary = {
  id: string;
  filename: string;
  originalName: string | null;
  url: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  scope: string;
  leadId: string | null;
  workOrderId: string | null;
  description: string | null;
  isImage: boolean;
  /** True when the attachment is inherited from the originating lead (work orders only). */
  inherited?: boolean;
  createdAt: string | null;
};

const GLOBAL_UPLOAD_OWNER_ID = '00000000-0000-4000-8000-000000000000';

const storageAdapter = createStorageAdapter();

const mediaService = createMediaService({
  prisma,
  storage: storageAdapter,
});

async function resolveAttachmentUrl(row: { fileUrl: string; storagePath: string | null }): Promise<string> {
  if (!row.storagePath) return row.fileUrl;
  const library = parseLibraryFromStoragePath(row.storagePath);
  if (!library) return row.fileUrl;
  if (library === 'content') {
    return storageAdapter.getPublicUrl(row.storagePath);
  }
  return storageAdapter.getSignedUrl(row.storagePath, 300);
}

async function toSummary(row: {
  id: string;
  filename: string;
  originalFilename: string | null;
  fileUrl: string;
  storagePath: string | null;
  mimeType: string;
  sizeBytes: number | null;
  mediaKind: string;
  createdAt: Date | null;
  mediaLinks: Array<{ ownerType: string; ownerId: string }>;
}, inherited = false): Promise<AttachmentSummary> {
  const leadLink = row.mediaLinks.find((link) => link.ownerType === 'lead');
  const workOrderLink = row.mediaLinks.find((link) => link.ownerType === 'work_order');
  const scope = workOrderLink ? 'work_order' : leadLink ? 'lead' : 'global';
  const resolvedUrl = await resolveAttachmentUrl({
    fileUrl: row.fileUrl,
    storagePath: row.storagePath,
  });
  return {
    id: row.id,
    filename: row.filename,
    originalName: row.originalFilename,
    url: resolvedUrl,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes ?? 0,
    kind: row.mediaKind === 'image' ? 'photo' : 'file',
    scope,
    leadId: leadLink?.ownerId ?? null,
    workOrderId: workOrderLink?.ownerId ?? null,
    description: null,
    isImage: isImageMimeType(row.mimeType),
    ...(inherited ? { inherited: true } : {}),
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

/** Validate the upload, persist the binary to disk, and create the DB row. */
export async function createAttachmentFromUpload(args: {
  file: File;
  input: AttachmentUploadInput;
}): Promise<AttachmentSummary> {
  const { file, input } = args;
  const ownerType = input.scope === 'work_order' ? 'work_order' : input.scope === 'lead' ? 'lead' : 'global_upload';
  const ownerId =
    input.scope === 'work_order'
      ? input.workOrderId
      : input.scope === 'lead'
        ? input.leadId
        : GLOBAL_UPLOAD_OWNER_ID;

  if (!ownerId) {
    throw new AttachmentServiceError('invalid_target', 'Attachment target is missing.');
  }

  const media = await mediaService.createMediaFromUpload({
    file,
    input: {
      library: input.scope === 'global' ? 'content' : 'admin_record',
      ownerType,
      ownerId,
      kind: input.kind === 'photo' ? 'image' : 'file',
      source: 'admin',
      description: input.description ?? null,
    },
  });

  return {
    id: media.id,
    filename: media.storagePath?.split('/').pop() ?? media.id,
    originalName: file.name || null,
    url: media.fileUrl,
    mimeType: media.mimeType,
    sizeBytes: 0,
    kind: input.kind,
    scope: input.scope,
    leadId: input.scope === 'lead' ? input.leadId ?? null : null,
    workOrderId: input.scope === 'work_order' ? input.workOrderId ?? null : null,
    description: input.description?.trim() || null,
    isImage: isImageMimeType(media.mimeType),
    createdAt: media.createdAt,
  };
}

/** List attachments matching the given filter (used by the global upload page + API). */
export async function listAttachments(query: AttachmentListQuery): Promise<AttachmentSummary[]> {
  const rows = await prisma.mediaFile.findMany({
    where: {
      ...(query.kind ? { mediaKind: query.kind === 'photo' ? 'image' : 'file' } : {}),
      mediaLinks: {
        some: {
          ...(query.scope === 'lead' ? { ownerType: 'lead' } : {}),
          ...(query.scope === 'work_order' ? { ownerType: 'work_order' } : {}),
          ...(query.scope === 'global' ? { ownerType: 'global_upload' } : {}),
          ...(query.leadId ? { ownerType: 'lead', ownerId: query.leadId } : {}),
          ...(query.workOrderId ? { ownerType: 'work_order', ownerId: query.workOrderId } : {}),
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 500,
    select: {
      id: true,
      filename: true,
      originalFilename: true,
      fileUrl: true,
      storagePath: true,
      mimeType: true,
      sizeBytes: true,
      mediaKind: true,
      createdAt: true,
      mediaLinks: {
        select: { ownerType: true, ownerId: true },
      },
    },
  });
  return Promise.all(rows.map((row) => toSummary(row)));
}

/** Attachments uploaded directly against a lead. */
export async function listLeadAttachments(leadId: string): Promise<AttachmentSummary[]> {
  const rows = await prisma.mediaFile.findMany({
    where: {
      mediaLinks: {
        some: { ownerType: 'lead', ownerId: leadId },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      filename: true,
      originalFilename: true,
      fileUrl: true,
      storagePath: true,
      mimeType: true,
      sizeBytes: true,
      mediaKind: true,
      createdAt: true,
      mediaLinks: {
        select: { ownerType: true, ownerId: true },
      },
    },
  });
  return Promise.all(rows.map((row) => toSummary(row)));
}

/**
 * Resolve the lead a work order originated from. Work orders link to a lead via
 * their estimate (`workOrder.estimate.leadId`).
 */
export async function getWorkOrderOriginLeadId(workOrderId: string): Promise<string | null> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    select: { estimate: { select: { leadId: true } } },
  });
  return workOrder?.estimate?.leadId ?? null;
}

/**
 * Attachments for a work order: its own uploads plus photos inherited (read-time)
 * from the originating lead. Inheritance is resolved on read so lead photos stay
 * in sync; lead attachments are flagged `inherited: true` and are read-only here.
 */
export async function listWorkOrderAttachments(workOrderId: string): Promise<AttachmentSummary[]> {
  const ownRowsPromise = prisma.mediaFile.findMany({
    where: {
      mediaLinks: {
        some: { ownerType: 'work_order', ownerId: workOrderId },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      filename: true,
      originalFilename: true,
      fileUrl: true,
      storagePath: true,
      mimeType: true,
      sizeBytes: true,
      mediaKind: true,
      createdAt: true,
      mediaLinks: {
        select: { ownerType: true, ownerId: true },
      },
    },
  });

  const leadId = await getWorkOrderOriginLeadId(workOrderId);
  const leadRowsPromise = leadId
    ? prisma.mediaFile.findMany({
        where: {
          mediaLinks: {
            some: { ownerType: 'lead', ownerId: leadId },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          filename: true,
          originalFilename: true,
          fileUrl: true,
          storagePath: true,
          mimeType: true,
          sizeBytes: true,
          mediaKind: true,
          createdAt: true,
          mediaLinks: {
            select: { ownerType: true, ownerId: true },
          },
        },
      })
    : Promise.resolve([]);

  const [ownRows, leadRows] = await Promise.all([ownRowsPromise, leadRowsPromise]);

  const [ownSummaries, leadSummaries] = await Promise.all([
    Promise.all(ownRows.map((row) => toSummary(row))),
    Promise.all(leadRows.map((row) => toSummary(row, true))),
  ]);
  return [...ownSummaries, ...leadSummaries];
}

/** Delete an attachment and remove its file from disk. */
export async function deleteAttachment(id: string): Promise<void> {
  const row = await prisma.mediaFile.findUnique({
    where: { id },
    select: { id: true, storagePath: true },
  });
  if (!row) throw new AttachmentServiceError('not_found', 'Attachment not found.');
  await prisma.mediaLink.deleteMany({ where: { mediaFileId: id } });
  await prisma.mediaFile.delete({ where: { id } });
  if (row.storagePath) {
    await storageAdapter.deleteObject(row.storagePath);
  }
}
