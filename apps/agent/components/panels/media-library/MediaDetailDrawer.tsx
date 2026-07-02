'use client';

import { Download, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { dispatchAgentMediaReference } from '@/lib/agent-navigation';
import type { MediaLibraryItem } from './types';

export function MediaDetailDrawer({
  item,
  onClose,
  onUpdated,
  onDeleted,
  inline = false,
}: {
  item: MediaLibraryItem;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
  /** Renders without the fixed-width overlay chrome, filling its host instead (used by DetailPane). */
  inline?: boolean;
}) {
  const [altText, setAltText] = useState(item.altText ?? '');
  const [saving, setSaving] = useState(false);

  async function saveAlt() {
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Saved');
      onUpdated();
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this file?')) return;
    try {
      const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Deleted');
      onDeleted();
      onClose();
    } catch {
      toast.error('Delete failed');
    }
  }

  return (
    <div
      className={
        inline
          ? 'flex h-full min-h-0 w-full flex-col bg-zinc-950'
          : 'flex h-full w-72 shrink-0 flex-col border-l border-white/10 bg-zinc-950/90'
      }
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[11px] font-medium text-zinc-200">Details</span>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <X size={14} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3 space-y-3">
        {item.mimeType.startsWith('video/') || item.mediaKind === 'video' ? (
          <video src={item.url} controls className="w-full rounded-md border border-white/10" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="w-full rounded-md border border-white/10" />
        )}
        {item.tags?.videoProduction && (
          <p className="text-[10px] text-zinc-500">
            {item.tags.videoProduction.frameRate} fps · {item.tags.videoProduction.durationSeconds}s ·{' '}
            {item.tags.videoProduction.syncMode} sync · {item.tags.videoProduction.resolution}
          </p>
        )}
        <label className="block text-[10px] text-zinc-500">
          Alt text
          <input
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-100"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveAlt()}
          className="w-full rounded bg-white/10 py-1.5 text-[11px] text-zinc-200 hover:bg-white/15"
        >
          Save metadata
        </button>
        <div className="flex gap-2">
          <a
            href={`/api/media/${item.id}/file`}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded border border-white/10 py-1.5 text-[11px] text-zinc-300 hover:bg-white/5"
          >
            <Download size={12} />
            Download
          </a>
          <button
            type="button"
            onClick={() =>
              dispatchAgentMediaReference({
                mediaId: item.id,
                url: item.url,
                agentId: item.tags?.agentId,
                kind:
                  item.mediaKind === 'video' || item.mimeType.startsWith('video/')
                    ? 'video'
                    : 'image',
              })
            }
            className="flex-1 rounded border border-violet-500/30 py-1.5 text-[11px] text-violet-200 hover:bg-violet-500/10"
          >
            Use in studio
          </button>
        </div>
        <button
          type="button"
          onClick={() => void remove()}
          className="inline-flex w-full items-center justify-center gap-1 rounded border border-red-500/30 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}