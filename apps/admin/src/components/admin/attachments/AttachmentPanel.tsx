'use client';

import * as React from 'react';
import { Download, ImagePlus, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/ui/frame';
import type { AttachmentSummary } from '@/src/lib/attachments/attachment-service';
import type { AttachmentScope } from '@/src/lib/validation/attachment';

const MAX_PHOTO_WIDTH = 300;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export type AttachmentPanelProps = {
  title: string;
  description?: string;
  scope: AttachmentScope;
  leadId?: string;
  workOrderId?: string;
  initialAttachments: AttachmentSummary[];
  allowPhotos?: boolean;
  allowFiles?: boolean;
};

export function AttachmentPanel({
  title,
  description,
  scope,
  leadId,
  workOrderId,
  initialAttachments,
  allowPhotos = true,
  allowFiles = false,
}: AttachmentPanelProps) {
  const [attachments, setAttachments] = React.useState<AttachmentSummary[]>(initialAttachments);
  const [uploading, setUploading] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const photos = attachments.filter((item) => item.isImage);
  const files = attachments.filter((item) => !item.isImage);

  const upload = async (file: File, kind: 'photo' | 'file') => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      formData.append('scope', scope);
      if (leadId) formData.append('leadId', leadId);
      if (workOrderId) formData.append('workOrderId', workOrderId);

      const res = await fetch('/api/admin/attachments', { method: 'POST', body: formData });
      const body = (await res.json()) as { attachment?: AttachmentSummary; error?: string };
      if (!res.ok || !body.attachment) throw new Error(body.error ?? 'Upload failed.');

      setAttachments((prev) => [body.attachment as AttachmentSummary, ...prev]);
      toast.success(`Uploaded ${body.attachment.originalName ?? body.attachment.filename}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>, kind: 'photo' | 'file') => {
    const selected = event.target.files;
    if (!selected || selected.length === 0) return;
    const queue = Array.from(selected);
    event.target.value = '';
    void (async () => {
      for (const file of queue) {
        await upload(file, kind);
      }
    })();
  };

  const handleDelete = async (attachment: AttachmentSummary) => {
    setDeletingId(attachment.id);
    try {
      const res = await fetch(`/api/admin/attachments/${attachment.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Could not delete attachment.');
      }
      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
      toast.success('Attachment removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete attachment.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Frame>
      <FramePanel className="overflow-hidden p-0">
        <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3 px-6 py-4">
          <div className="space-y-1">
            <FrameTitle>{title}</FrameTitle>
            {description ? <FrameDescription>{description}</FrameDescription> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {allowPhotos ? (
              <>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleSelect(event, 'photo')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus />
                  Upload photo
                </Button>
              </>
            ) : null}
            {allowFiles ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(event) => handleSelect(event, 'file')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload />
                  Upload file
                </Button>
              </>
            ) : null}
          </div>
        </FrameHeader>

        <div className="space-y-6 px-6 py-6">
          {attachments.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              <Paperclip className="h-5 w-5" />
              Nothing uploaded yet.
            </div>
          ) : null}

          {allowPhotos && photos.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                Photos
              </div>
              <div className="flex flex-wrap gap-4">
                {photos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="group relative overflow-hidden rounded-lg border"
                    style={{ borderColor: 'var(--border)', maxWidth: MAX_PHOTO_WIDTH }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.description ?? photo.originalName ?? 'Uploaded photo'}
                      style={{ maxWidth: MAX_PHOTO_WIDTH, width: '100%', height: 'auto', display: 'block' }}
                    />
                    {photo.inherited ? (
                      <Badge variant="secondary" className="absolute left-2 top-2">
                        From lead
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        aria-label="Delete photo"
                        loading={deletingId === photo.id}
                        onClick={() => void handleDelete(photo)}
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          ) : null}

          {files.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                Files
              </div>
              <ul className="space-y-2">
                {files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Paperclip className="h-4 w-4 shrink-0" style={{ color: 'var(--muted-foreground)' }} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {file.originalName ?? file.filename}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {formatBytes(file.sizeBytes)}
                          {file.inherited ? ' · from lead' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Download file"
                        render={<a href={file.url} download target="_blank" rel="noreferrer" />}
                      >
                        <Download />
                      </Button>
                      {!file.inherited ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete file"
                          loading={deletingId === file.id}
                          onClick={() => void handleDelete(file)}
                        >
                          <Trash2 />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </FramePanel>
    </Frame>
  );
}
