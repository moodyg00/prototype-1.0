import { z } from 'zod';

export const ATTACHMENT_KINDS = ['photo', 'file'] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_SCOPES = ['global', 'lead', 'work_order'] as const;
export type AttachmentScope = (typeof ATTACHMENT_SCOPES)[number];

/** MIME types accepted for the "photo" kind. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
] as const;

/** MIME types accepted for the "file" kind (in addition to images). */
export const ALLOWED_FILE_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
] as const;

/** 10 MB cap for photos, 25 MB cap for generic files. */
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export function isImageMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Metadata accompanying an upload (the binary itself arrives as multipart form-data). */
export const attachmentUploadSchema = z
  .object({
    kind: z.enum(ATTACHMENT_KINDS).default('file'),
    scope: z.enum(ATTACHMENT_SCOPES).default('global'),
    leadId: z.string().uuid().optional().nullable(),
    workOrderId: z.string().uuid().optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'lead' && !data.leadId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['leadId'], message: 'leadId is required for lead-scoped uploads.' });
    }
    if (data.scope === 'work_order' && !data.workOrderId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['workOrderId'], message: 'workOrderId is required for work-order-scoped uploads.' });
    }
  });

export type AttachmentUploadInput = z.infer<typeof attachmentUploadSchema>;

/** Query params for listing attachments. */
export const attachmentListQuerySchema = z.object({
  scope: z.enum(ATTACHMENT_SCOPES).optional(),
  leadId: z.string().uuid().optional(),
  workOrderId: z.string().uuid().optional(),
  kind: z.enum(ATTACHMENT_KINDS).optional(),
});

export type AttachmentListQuery = z.infer<typeof attachmentListQuerySchema>;

/** Validate a file's mime type + size against the declared kind. Throws on failure. */
export function assertUploadAllowed(args: { kind: AttachmentKind; mimeType: string; sizeBytes: number }): void {
  const { kind, mimeType, sizeBytes } = args;

  if (kind === 'photo') {
    if (!isImageMimeType(mimeType)) {
      throw new AttachmentValidationError(`Unsupported image type: ${mimeType || 'unknown'}.`);
    }
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new AttachmentValidationError('Image exceeds the 10 MB limit.');
    }
    return;
  }

  if (!(ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new AttachmentValidationError(`Unsupported file type: ${mimeType || 'unknown'}.`);
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new AttachmentValidationError('File exceeds the 25 MB limit.');
  }
}

export class AttachmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttachmentValidationError';
  }
}
