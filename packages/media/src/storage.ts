import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export type MediaLibraryPrefix = 'admin_record' | 'submitted' | 'content';

export type StoredMediaObject = {
  storagePath: string;
  fileUrl: string;
  sizeBytes: number;
};

export interface StorageAdapter {
  putObject(input: {
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
    library: MediaLibraryPrefix;
  }): Promise<StoredMediaObject>;
  deleteObject(storagePath: string): Promise<void>;
}

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

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly basePath = path.join(process.cwd(), 'public', 'uploads'),
    private readonly baseUrl = '/uploads',
  ) {}

  async putObject(input: {
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
    library: MediaLibraryPrefix;
  }): Promise<StoredMediaObject> {
    const ext = safeExtension(input.originalName, input.mimeType);
    const objectKey = `${input.library}/${randomUUID()}.${ext}`;
    const absolutePath = path.join(this.basePath, objectKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.buffer);
    return {
      storagePath: objectKey,
      fileUrl: `${this.baseUrl}/${objectKey}`,
      sizeBytes: input.buffer.byteLength,
    };
  }

  async deleteObject(storagePath: string): Promise<void> {
    if (!storagePath || storagePath.includes('..')) return;
    const absolutePath = path.join(this.basePath, storagePath);
    try {
      await fs.unlink(absolutePath);
    } catch {
      // Missing files are intentionally ignored.
    }
  }
}

export class SupabaseStorageAdapter implements StorageAdapter {
  async putObject(_input: {
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
    library: MediaLibraryPrefix;
  }): Promise<StoredMediaObject> {
    throw new Error('SupabaseStorageAdapter is not wired yet.');
  }

  async deleteObject(_storagePath: string): Promise<void> {
    throw new Error('SupabaseStorageAdapter is not wired yet.');
  }
}
