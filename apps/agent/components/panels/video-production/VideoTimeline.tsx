'use client';

import { useCallback, useEffect, useState } from 'react';
import { Film, RefreshCw, Scissors, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { fetchJson } from '@/lib/memory/fetch-json';
import type { TimelineClip, VideoTimelineProject } from '@prototype/ide-tools';

const PX_PER_SEC = 48;

function formatMs(ms: number): string {
  const s = ms / 1000;
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export function VideoTimeline({
  agentId,
  onPreviewMediaId,
}: {
  agentId: string;
  onPreviewMediaId?: (mediaId: string) => void;
}) {
  const [project, setProject] = useState<VideoTimelineProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{ project: VideoTimelineProject }>(
        `/api/video-production/timeline?agentId=${encodeURIComponent(agentId)}`,
      );
      setProject(data.project);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function syncTimeline() {
    try {
      const res = await fetch('/api/video-production/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = (await res.json()) as { project?: VideoTimelineProject; error?: string; ffmpeg?: boolean };
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      setProject(data.project ?? null);
      toast.success(data.ffmpeg ? 'Sync applied (ffmpeg available)' : 'Sync applied (install ffmpeg for conform)');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sync failed');
    }
  }

  async function renderTimeline() {
    setRendering(true);
    try {
      const res = await fetch('/api/video-production/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = (await res.json()) as {
        item?: { id: string };
        warnings?: string[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Render failed');
      toast.success('Timeline rendered to library');
      if (data.warnings?.length) toast.message(data.warnings.join('; '));
      if (data.item?.id) onPreviewMediaId?.(data.item.id);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Render failed');
    } finally {
      setRendering(false);
    }
  }

  async function patchClip(clipId: string, patch: Partial<TimelineClip>) {
    const res = await fetch('/api/video-production/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_clip',
        agentId,
        clipId,
        patch,
      }),
    });
    const data = (await res.json()) as { project?: VideoTimelineProject; error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Update failed');
    setProject(data.project ?? null);
  }

  async function removeClip(clipId: string) {
    const res = await fetch('/api/video-production/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_clip', agentId, clipId }),
    });
    const data = (await res.json()) as { project?: VideoTimelineProject };
    setProject(data.project ?? null);
  }

  const durationMs = project?.durationMs ?? 6000;
  const widthPx = Math.max(320, (durationMs / 1000) * PX_PER_SEC + 80);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-zinc-500">
          {project?.frameRate ?? '—'} fps · {project?.settings.syncMode ?? 'auto'} sync ·{' '}
          {formatMs(durationMs)}
        </span>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-400"
        >
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
          Reload
        </button>
        <button
          type="button"
          onClick={() => void syncTimeline()}
          className="inline-flex items-center gap-1 rounded border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200"
        >
          <Scissors size={10} />
          Apply sync
        </button>
        <button
          type="button"
          disabled={rendering || !project?.clips.length}
          onClick={() => void renderTimeline()}
          className="ml-auto inline-flex items-center gap-1 rounded bg-amber-600/90 px-2.5 py-1 text-[10px] text-white disabled:opacity-40"
        >
          <Sparkles size={10} />
          {rendering ? 'Rendering…' : 'Render timeline'}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2">
        <div className="relative h-28" style={{ minWidth: widthPx }}>
          <div className="absolute inset-x-0 top-0 flex h-4 border-b border-white/5 text-[8px] text-zinc-600">
            {Array.from({ length: Math.ceil(durationMs / 1000) + 1 }).map((_, i) => (
              <div key={i} className="shrink-0 border-l border-white/5 pl-0.5" style={{ width: PX_PER_SEC }}>
                {i}s
              </div>
            ))}
          </div>
          <div className="absolute left-0 right-0 top-6 text-[9px] text-zinc-500">Video</div>
          {(project?.clips ?? [])
            .filter((c) => c.track === 'video')
            .map((clip) => (
              <div
                key={clip.id}
                className="absolute top-8 flex h-10 cursor-grab items-center overflow-hidden rounded border border-amber-500/40 bg-amber-500/15 px-1 text-[9px] text-amber-100"
                style={{
                  left: (clip.startMs / 1000) * PX_PER_SEC,
                  width: Math.max(24, (clip.durationMs / 1000) * PX_PER_SEC),
                }}
                title={`${clip.label ?? clip.mediaId.slice(0, 8)} offset ${clip.offsetMs}ms`}
              >
                <Film size={10} className="mr-1 shrink-0 opacity-70" />
                <span className="truncate">{clip.label ?? clip.mediaId.slice(0, 8)}</span>
                <button
                  type="button"
                  className="ml-auto shrink-0 text-zinc-500 hover:text-red-300"
                  onClick={() => void removeClip(clip.id)}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
        </div>
      </div>

      <ul className="max-h-32 space-y-1 overflow-auto text-[10px] text-zinc-500">
        {(project?.clips ?? []).map((clip) => (
          <li key={clip.id} className="flex flex-wrap items-center gap-2 rounded border border-white/5 px-2 py-1">
            <button
              type="button"
              className="text-amber-300 hover:underline"
              onClick={() => onPreviewMediaId?.(clip.mediaId)}
            >
              {clip.mediaId.slice(0, 8)}…
            </button>
            <label className="flex items-center gap-1">
              Start
              <input
                type="number"
                className="w-16 rounded border border-white/10 bg-black/40 px-1"
                value={clip.startMs}
                onChange={(e) => void patchClip(clip.id, { startMs: Number(e.target.value) })}
              />
              ms
            </label>
            <label className="flex items-center gap-1">
              Offset
              <input
                type="number"
                className="w-14 rounded border border-white/10 bg-black/40 px-1"
                value={clip.offsetMs}
                onChange={(e) => void patchClip(clip.id, { offsetMs: Number(e.target.value) })}
              />
            </label>
            <span>{clip.syncAnchor}</span>
          </li>
        ))}
        {!project?.clips.length && (
          <li className="py-4 text-center">No clips — generate video or add from library via API/workflow.</li>
        )}
      </ul>
    </div>
  );
}