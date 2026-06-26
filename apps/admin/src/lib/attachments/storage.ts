import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Local filesystem storage for uploaded attachments.
 *
 * Files are written under `public/uploads/` so Next.js serves them directly at
 * `/uploads/<filename>` in dev. The DB row stores both the on-disk filename and
 * the public URL. NOTE: with `output: 'standalone'` production builds, files
 * written at runtime are not served from the static `public/` mount, so a
 * dedicated object store (S3/Supabase) should replace this before production.
 */
const PUBLIC_DIR_SEGMENT = 'uploads';
export const UPLOADS_DIR = path.join(process.cwd(), 'public', PUBLIC_DIR_SEGMENT);

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/zip': 'zip',
  'application/json': 'json',
};

function safeExtension(originalName: string | undefined, mimeType: string): string {
  const fromName = originalName ? path.extname(originalName).replace(/^\./, '').toLowerCase() : '';
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) return fromName;
  return EXTENSION_BY_MIME[mimeType] ?? 'bin';
}

export type StoredFile = {
  filename: string;
  url: string;
  sizeBytes: number;
};

/** Persist a binary buffer to disk and return its stored filename + public URL. */
export async function saveUploadedFile(args: {
  buffer: Buffer;
  mimeType: string;
  originalName?: string;
}): Promise<StoredFile> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const extension = safeExtension(args.originalName, args.mimeType);
  const filename = `${randomUUID()}.${extension}`;
  const absolutePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(absolutePath, args.buffer);
  return {
    filename,
    url: `/${PUBLIC_DIR_SEGMENT}/${filename}`,
    sizeBytes: args.buffer.byteLength,
  };
}

/** Remove a stored file from disk. Missing files are ignored. */
export async function deleteStoredFile(filename: string): Promise<void> {
  if (!filename || filename.includes('/') || filename.includes('..')) return;
  const absolutePath = path.join(UPLOADS_DIR, filename);
  try {
    await fs.unlink(absolutePath);
  } catch {
    // File already gone; nothing to do.
  }
}
