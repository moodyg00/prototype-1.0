'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, AudioLines, RefreshCw, Scissors } from 'lucide-react';
import { toast } from 'sonner';

import { fetchJson } from '@/lib/memory/fetch-json';
import type { TimelineClip, VideoTimelineProject } from '@prototype/ide-tools';
import { TimelineClipBlock } from './TimelineClipBlock';
import { TimelineWaveform } from './TimelineWaveform';

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
  const [queueJobs, setQueueJobs] = useState<Array<{ id: string; status: string }>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchJson<{ project: VideoTimelineProject }>(
        `/api/video-production/timeline?agentId=${encodeURIComponent(agentId)}`,
      );
      setProject(data.project);
      const q = await fetchJson<{ jobs: Array<{ id: string; status: string }> }>(
        `/api/video-production/render/queue?agentId=${encodeURIComponent(agentId)}`,
      );
      setQueueJobs(q.jobs ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function analyzeTimeline() {
    try {
      const res = await fetch('/api/video-production/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = (await res.json()) as { project?: VideoTimelineProject; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Analyze failed');
      setProject(data.project ?? null);
      toast.success(`BPM ${data.project?.analysis.bpm ?? '—'} · ${data.project?.analysis.beatMarkersMs.length ?? 0} beats`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analyze failed');
    }
  }

  async function syncTimeline() {
    try {
      const res = await fetch('/api/video-production/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = (await res.json()) as { project?: VideoTimelineProject; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      setProject(data.project ?? null);
      toast.success('Sync applied');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sync failed');
    }
  }

  async function queueRender() {
    try {
      const res = await fetch('/api/video-production/render/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const data = (await res.json()) as { job?: { id: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Queue failed');
      toast.success(`Queued render ${data.job?.id?.slice(0, 8) ?? ''}`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Queue failed');
    }
  }

  async function patchClip(clipId: string, patch: Partial<TimelineClip>) {
    const res = await fetch('/api/video-production/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_clip', agentId, clipId, patch }),
    });
    const data = (await res.json()) as { project?: VideoTimelineProject; error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Update failed');
    setProject(data.project ?? null);
  }

  async function addAudioFromLastVideo() {
    const video = project?.clips.find((c) => c.track === 'video');
    if (!video) {
      toast.error('Add a video clip first');
      return;
    }
    const res = await fetch('/api/video-production/timeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_clip',
        agentId,
        mediaId: video.mediaId,
        label: 'Audio (linked)',
        track: 'audio',
        durationMs: video.durationMs,
      }),
    });
    const data = (await res.json()) as { project?: VideoTimelineProject };
    setProject(data.project ?? null);
    toast.success('Audio track clip added');
  }

  const durationMs = project?.durationMs ?? 6000;
  const widthPx = Math.max(320, (durationMs / 1000) * PX_PER_SEC + 80);
  const analysis = project?.analysis ?? { bpm: null, beatMarkersMs: [], waveformPeaks: [] };

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-zinc-500">
          {project?.frameRate ?? '—'} fps · BPM {analysis.bpm ?? project?.settings.bpm ?? '—'} ·{' '}
          {formatMs(durationMs)}
        </span>
        <button type="button" onClick={() => void load()} className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-400">
          <RefreshCw size={10} className={loading ? 'inline animate-spin' : 'inline'} /> Reload
        </button>
        <button type="button" onClick={() => void analyzeTimeline()} className="rounded border border-violet-500/30 px-2 py-1 text-[10px] text-violet-200">
          <AudioLines size={10} className="inline" /> Analyze waveform
        </button>
        <button type="button" onClick={() => void syncTimeline()} className="rounded border border-amber-500/30 px-2 py-1 text-[10px] text-amber-200">
          <Scissors size={10} className="inline" /> Apply sync
        </button>
        <button type="button" onClick={() => void addAudioFromLastVideo()} className="rounded border border-cyan-500/30 px-2 py-1 text-[10px] text-cyan-200">
          + Audio track
        </button>
        <button
          type="button"
          disabled={!project?.clips.length}
          onClick={() => void queueRender()}
          className="ml-auto rounded bg-amber-600/90 px-2.5 py-1 text-[10px] text-white disabled:opacity-40"
        >
          <Activity size={10} className="inline" /> Queue render
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/10 bg-black/30 p-2">
        <TimelineWaveform
          durationMs={durationMs}
          peaks={analysis.waveformPeaks}
          beatMarkersMs={analysis.beatMarkersMs}
        />
        <div className="relative mt-2 h-24" style={{ minWidth: widthPx }}>
          <div className="absolute inset-x-0 top-0 flex h-4 text-[8px] text-zinc-600">
            {Array.from({ length: Math.ceil(durationMs / 1000) + 1 }).map((_, i) => (
              <div key={i} className="shrink-0 border-l border-white/5 pl-0.5" style={{ width: PX_PER_SEC }}>
                {i}s
              </div>
            ))}
          </div>
          <div className="absolute top-5 text-[9px] text-zinc-500">Video</div>
          <div className="absolute top-[3.25rem] text-[9px] text-zinc-500">Audio</div>
          {(project?.clips ?? []).map((clip) => (
            <TimelineClipBlock
              key={clip.id}
              clip={clip}
              onCommitStartMs={(id, startMs) => void patchClip(id, { startMs })}
              onRemove={(id) =>
                void fetch('/api/video-production/timeline', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'remove_clip', agentId, clipId: id }),
                }).then((r) => r.json().then((d: { project?: VideoTimelineProject }) => setProject(d.project ?? null)))
              }
            />
          ))}
        </div>
      </div>

      {queueJobs.length > 0 && (
        <p className="text-[10px] text-zinc-600">
          Render queue: {queueJobs.slice(0, 3).map((j) => `${j.id.slice(0, 6)}:${j.status}`).join(' · ')}
        </p>
      )}

      <ul className="max-h-28 space-y-1 overflow-auto text-[10px] text-zinc-500">
        {(project?.clips ?? []).map((clip) => (
          <li key={clip.id} className="flex flex-wrap items-center gap-2 rounded border border-white/5 px-2 py-1">
            <button type="button" className="text-amber-300 hover:underline" onClick={() => onPreviewMediaId?.(clip.mediaId)}>
              {clip.track}:{clip.mediaId.slice(0, 8)}…
            </button>
            <span>{clip.syncAnchor}</span>
            <button type="button" onClick={() => void patchClip(clip.id, { track: clip.track === 'audio' ? 'video' : 'audio' })}>
              Swap track
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}