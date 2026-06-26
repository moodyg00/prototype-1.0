import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
  getSignedUrl(storagePath: string, expiresInSeconds?: number): Promise<string>;
  getPublicUrl(storagePath: string): string;
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

  async getSignedUrl(storagePath: string): Promise<string> {
    return this.getPublicUrl(storagePath);
  }

  getPublicUrl(storagePath: string): string {
    const normalized = storagePath.replace(/^\/+/, '');
    return `${this.baseUrl}/${normalized}`;
  }
}

export class SupabaseStorageAdapter implements StorageAdapter {
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly privateUrlTtlSeconds: number;

  constructor(args?: { bucket?: string; privateUrlTtlSeconds?: number }) {
    const supabaseUrl =
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SupabaseStorageAdapter requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }

    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket = args?.bucket ?? process.env.SUPABASE_STORAGE_BUCKET ?? 'media';
    this.privateUrlTtlSeconds = args?.privateUrlTtlSeconds ?? 300;
  }

  async putObject(input: {
    buffer: Buffer;
    mimeType: string;
    originalName?: string;
    library: MediaLibraryPrefix;
  }): Promise<StoredMediaObject> {
    const ext = safeExtension(input.originalName, input.mimeType);
    const objectKey = `${input.library}/${randomUUID()}.${ext}`;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(objectKey, input.buffer, {
        contentType: input.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const fileUrl =
      input.library === 'content'
        ? this.getPublicUrl(objectKey)
        : await this.getSignedUrl(objectKey, this.privateUrlTtlSeconds);

    return {
      storagePath: objectKey,
      fileUrl,
      sizeBytes: input.buffer.byteLength,
    };
  }

  async deleteObject(storagePath: string): Promise<void> {
    if (!storagePath || storagePath.includes('..')) return;
    const { error } = await this.client.storage.from(this.bucket).remove([storagePath]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async getSignedUrl(storagePath: string, expiresInSeconds = this.privateUrlTtlSeconds): Promise<string> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data?.signedUrl) {
      throw new Error(`Supabase signed URL failed: ${error?.message ?? 'unknown error'}`);
    }
    return data.signedUrl;
  }

  getPublicUrl(storagePath: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(storagePath);
    if (!data?.publicUrl) {
      throw new Error('Supabase public URL generation failed.');
    }
    return data.publicUrl;
  }
}

export function parseLibraryFromStoragePath(storagePath: string): MediaLibraryPrefix | null {
  if (storagePath.startsWith('admin_record/')) return 'admin_record';
  if (storagePath.startsWith('submitted/')) return 'submitted';
  if (storagePath.startsWith('content/')) return 'content';
  return null;
}

export function createStorageAdapter(): StorageAdapter {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceRoleKey) {
    return new SupabaseStorageAdapter();
  }
  return new LocalStorageAdapter();
}
