import { z } from 'zod';

export const MEDIA_KINDS = ['image', 'gif', 'video', 'file'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_LINK_OWNER_TYPES = ['lead', 'work_order', 'global_upload'] as const;
export type MediaLinkOwnerType = (typeof MEDIA_LINK_OWNER_TYPES)[number];

export const LIBRARY_PREFIXES = ['admin_record', 'submitted', 'content'] as const;
export type LibraryPrefix = (typeof LIBRARY_PREFIXES)[number];

export const MEDIA_SOURCE_VALUES = ['admin', 'submitted', 'agent'] as const;
export type MediaSource = (typeof MEDIA_SOURCE_VALUES)[number];

export const SCAN_STATUS_VALUES = ['pending', 'clean', 'quarantined', 'failed'] as const;
export type ScanStatus = (typeof SCAN_STATUS_VALUES)[number];

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/svg+xml',
] as const;

export const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

export const ALLOWED_FILE_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
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

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const mediaUploadSchema = z.object({
  library: z.enum(LIBRARY_PREFIXES).default('admin_record'),
  ownerType: z.enum(MEDIA_LINK_OWNER_TYPES),
  ownerId: z.string().uuid(),
  kind: z.enum(MEDIA_KINDS).default('file'),
  source: z.enum(MEDIA_SOURCE_VALUES).default('admin'),
  role: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  /** Structured tags for agent workspace (stored as JSON on MediaFile). */
  tagsRecord: z.record(z.string(), z.unknown()).optional(),
});

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;

export function isImageMimeType(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function assertUploadAllowed(args: { kind: MediaKind; mimeType: string; sizeBytes: number }): void {
  const { kind, mimeType, sizeBytes } = args;
  if (kind === 'image' || kind === 'gif') {
    if (!isImageMimeType(mimeType)) {
      throw new MediaValidationError(`Unsupported image type: ${mimeType || 'unknown'}.`);
    }
    if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
      throw new MediaValidationError('Image exceeds the 10 MB limit.');
    }
    return;
  }
  if (kind === 'video') {
    if (!(ALLOWED_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)) {
      throw new MediaValidationError(`Unsupported video type: ${mimeType || 'unknown'}.`);
    }
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new MediaValidationError('Video exceeds the 25 MB limit.');
    }
    return;
  }
  if (!(ALLOWED_FILE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    throw new MediaValidationError(`Unsupported file type: ${mimeType || 'unknown'}.`);
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new MediaValidationError('File exceeds the 25 MB limit.');
  }
}

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}
