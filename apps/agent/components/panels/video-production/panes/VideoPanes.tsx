'use client';

import { Sparkles } from 'lucide-react';
import { fetchJson } from '@/lib/memory/fetch-json';
import type { PaneRenderContext } from '@/lib/pane-types';
import type { MediaLibraryItem } from '../../media-library/types';
import { VideoModelPicker } from '../VideoModelPicker';
import { VideoProductionParamsPanel } from '../VideoProductionParamsPanel';
import { VideoTimeline } from '../VideoTimeline';
import { useVideoProduction } from '../VideoProductionProvider';

export function VideoModelPickerPane({ context: _context }: { context: PaneRenderContext }) {
  const { agentId, setAgentId, agentIds, models, prefs, savePrefs } = useVideoProduction();
  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      <select
        className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px]"
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
      >
        {agentIds.map((id) => (
          <option key={id} value={id}>
            Agent: {id}
          </option>
        ))}
      </select>
      {prefs && models.length > 0 ? (
        <VideoModelPicker
          models={models}
          primaryId={prefs.defaultModelId}
          backupId={prefs.backupModelId}
          onPrimaryChange={(id) => void savePrefs({ defaultModelId: id })}
          onBackupChange={(id) => void savePrefs({ backupModelId: id })}
        />
      ) : null}
    </div>
  );
}

export function VideoParamsPane({ context: _context }: { context: PaneRenderContext }) {
  const { settings, persistSettings } = useVideoProduction();
  if (!settings) return <p className="p-3 text-[11px] text-zinc-600">Loading params…</p>;
  return (
    <div className="h-full overflow-auto p-3">
      <VideoProductionParamsPanel settings={settings} onChange={(next) => void persistSettings(next)} />
    </div>
  );
}

export function VideoQuickGenPane({ context: _context }: { context: PaneRenderContext }) {
  const { prompt, setPrompt, refUrl, generating, generate } = useVideoProduction();
  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      <textarea
        className="min-h-[72px] w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[12px] outline-none focus:border-amber-500/40"
        placeholder="Describe the shot, motion, and mood…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      {refUrl ? (
        <div className="text-[10px] text-zinc-500">
          Reference
          {refUrl.match(/\.(mp4|webm)|video/i) ? (
            <video src={refUrl} className="mt-1 max-h-24 rounded border border-white/10" controls muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={refUrl} alt="" className="mt-1 h-16 rounded border border-white/10" />
          )}
        </div>
      ) : null}
      <button
        type="button"
        disabled={generating}
        onClick={() => void generate()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2 text-[12px] font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        <Sparkles size={14} />
        {generating ? 'Rendering…' : 'Generate video'}
      </button>
    </div>
  );
}

export function VideoPreviewPane({ context: _context }: { context: PaneRenderContext }) {
  const { preview } = useVideoProduction();
  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <div className="min-h-0 flex-1 rounded-lg border border-white/10 bg-black/25 p-2">
        {preview && preview.mimeType.startsWith('video/') ? (
          <video src={preview.url} controls className="max-h-full w-full" />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt="" className="max-h-full w-full object-contain" />
        ) : (
          <p className="py-10 text-center text-[11px] text-zinc-600">Program monitor</p>
        )}
      </div>
    </div>
  );
}

export function VideoQueuePane({ context: _context }: { context: PaneRenderContext }) {
  const { jobs, openMediaLibrary } = useVideoProduction();
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
        Render queue
      </div>
      <ul className="min-h-0 flex-1 overflow-auto p-2 text-[10px]">
        {jobs.map((j) => (
          <li key={j.id} className="mb-2 rounded border border-white/5 bg-white/[0.02] p-2 text-zinc-400">
            <div className="flex justify-between text-zinc-300">
              <span>{j.status}</span>
              {j.progress != null ? <span>{j.progress}%</span> : null}
            </div>
            <div className="line-clamp-2">{j.prompt}</div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="m-2 rounded border border-white/10 py-1.5 text-[10px] text-amber-300 hover:bg-white/5"
        onClick={openMediaLibrary}
      >
        Open media library
      </button>
    </div>
  );
}

export function VideoTimelinePane({ context: _context }: { context: PaneRenderContext }) {
  const { agentId, setPreview } = useVideoProduction();
  return (
    <div className="h-full min-h-0 overflow-auto p-3">
      <VideoTimeline
        agentId={agentId}
        onPreviewMediaId={async (id) => {
          const data = await fetchJson<{ item: MediaLibraryItem }>(`/api/media/${id}`);
          if (data.item) setPreview(data.item);
        }}
      />
    </div>
  );
}

