import type { PrismaClient } from '@prototype/db';

import type { StorageAdapter } from './storage';
import { assertUploadAllowed, isImageMimeType, type MediaUploadInput } from './validation';

export type MediaSummary = {
  id: string;
  fileUrl: string;
  storagePath: string | null;
  mimeType: string;
  mediaKind: string;
  libraryType: string;
  scanStatus: string;
  source: string;
  tags: unknown;
  createdAt: string | null;
};

type MediaServiceDeps = {
  prisma: PrismaClient;
  storage: StorageAdapter;
};

const MEDIA_SELECT = {
  id: true,
  fileUrl: true,
  storagePath: true,
  mimeType: true,
  mediaKind: true,
  libraryType: true,
  scanStatus: true,
  source: true,
  tags: true,
  createdAt: true,
} as const;

function toSummary(row: {
  id: string;
  fileUrl: string;
  storagePath: string | null;
  mimeType: string;
  mediaKind: string;
  libraryType: string;
  scanStatus: string;
  source: string;
  tags: unknown;
  createdAt: Date | null;
}): MediaSummary {
  return {
    ...row,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

function normalizeKind(kind: MediaUploadInput['kind'], mimeType: string): 'image' | 'gif' | 'video' | 'file' {
  if (kind === 'file') {
    return isImageMimeType(mimeType) ? 'image' : 'file';
  }
  return kind;
}

export function createMediaService(deps: MediaServiceDeps) {
  const { prisma, storage } = deps;

  return {
    async createMediaFromUpload(args: { file: File; input: MediaUploadInput }): Promise<MediaSummary> {
      const { file, input } = args;
      const mimeType = file.type || 'application/octet-stream';
      assertUploadAllowed({ kind: input.kind, mimeType, sizeBytes: file.size });
      const buffer = Buffer.from(await file.arrayBuffer());
      return this.createMediaFromBuffer({
        buffer,
        mimeType,
        originalName: file.name,
        input,
      });
    },

    async createMediaFromBuffer(args: {
      buffer: Buffer;
      mimeType: string;
      originalName?: string;
      input: MediaUploadInput;
    }): Promise<MediaSummary> {
      const { input } = args;
      assertUploadAllowed({ kind: input.kind, mimeType: args.mimeType, sizeBytes: args.buffer.byteLength });
      const stored = await storage.putObject({
        buffer: args.buffer,
        mimeType: args.mimeType,
        originalName: args.originalName,
        library: input.library,
      });

      const media = await prisma.mediaFile.create({
        data: {
          filename: stored.storagePath.split('/').pop() ?? stored.storagePath,
          originalFilename: args.originalName ?? null,
          fileUrl: stored.fileUrl,
          mimeType: args.mimeType,
          mediaKind: normalizeKind(input.kind, args.mimeType),
          sizeBytes: stored.sizeBytes,
          tags: (input.tagsRecord ?? input.tags ?? []) as object,
          libraryType: input.library,
          source: input.source,
          scanStatus: input.source === 'submitted' ? 'pending' : 'clean',
          storagePath: stored.storagePath,
          categoryId: input.categoryId ?? null,
        },
        select: MEDIA_SELECT,
      });

      await prisma.mediaLink.create({
        data: {
          mediaFileId: media.id,
          ownerType: input.ownerType,
          ownerId: input.ownerId,
          role: input.role ?? null,
          metadata: input.description ? { description: input.description } : undefined,
        },
      });

      return toSummary(media);
    },
  };
}
