'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clapperboard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  AGENT_MEDIA_REFERENCE_EVENT,
  dispatchAgentNavigate,
  type AgentMediaReferenceDetail,
} from '@/lib/agent-navigation';
import { fetchJson } from '@/lib/memory/fetch-json';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import type { AgentVideoModelPrefs, VideoModelOption, VideoProductionSettings } from '@prototype/ide-tools';
import type { MediaLibraryItem } from '../media-library/types';
import { VideoModelPicker } from './VideoModelPicker';
import { VideoProductionParamsPanel } from './VideoProductionParamsPanel';

type ModelRow = VideoModelOption & { configured: boolean };

type JobRow = {
  id: string;
  prompt: string;
  status: string;
  progress?: number;
  mediaId?: string;
  stub?: boolean;
  settings: VideoProductionSettings;
  createdAt: string;
};

export function VideoProductionStudioView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [agentId, setAgentId] = useState('default');
  const [agentIds, setAgentIds] = useState<string[]>(['default']);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [prefs, setPrefs] = useState<AgentVideoModelPrefs | null>(null);
  const [settings, setSettings] = useState<VideoProductionSettings | null>(null);
  const [prompt, setPrompt] = useState('');
  const [preview, setPreview] = useState<MediaLibraryItem | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [refUrl, setRefUrl] = useState<string | null>(null);

  const loadPrefs = useCallback(async (id: string) => {
    const data = await fetchJson<{ prefs: AgentVideoModelPrefs; models: ModelRow[] }>(
      `/api/agents/${encodeURIComponent(id)}/video-models`,
    );
    setPrefs(data.prefs);
    setModels(data.models);
    setSettings(data.prefs.productionDefaults);
  }, []);

  const loadJobs = useCallback(async () => {
    const data = await fetchJson<{ jobs: JobRow[] }>(
      `/api/video-production/jobs?agentId=${encodeURIComponent(agentId)}`,
    );
    setJobs(data.jobs ?? []);
  }, [agentId]);

  useEffect(() => {
    void (async () => {
      try {
        const a = await fetchJson<{ agentIds: string[] }>('/api/memory/agents');
        if (a.agentIds?.length) setAgentIds(a.agentIds);
      } catch {
        /* ignore */
      }
      await loadPrefs(agentId);
      await loadJobs();
    })();
  }, []);

  useEffect(() => {
    void loadPrefs(agentId);
    void loadJobs();
  }, [agentId, loadPrefs, loadJobs]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentMediaReferenceDetail>).detail;
      if (detail?.url) {
        setRefUrl(detail.url);
        toast.message('Reference clip attached');
      }
    };
    window.addEventListener(AGENT_MEDIA_REFERENCE_EVENT, handler);
    return () => window.removeEventListener(AGENT_MEDIA_REFERENCE_EVENT, handler);
  }, []);

  async function savePrefs(next: Partial<AgentVideoModelPrefs>) {
    const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/video-models`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      toast.error('Could not save video prefs');
      return;
    }
    const data = (await res.json()) as { prefs: AgentVideoModelPrefs };
    setPrefs(data.prefs);
    setSettings(data.prefs.productionDefaults);
  }

  async function persistSettings(next: VideoProductionSettings) {
    setSettings(next);
    await savePrefs({ productionDefaults: next });
  }

  async function generate() {
    if (!prompt.trim() || !settings) {
      toast.error('Enter a prompt');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/video-production/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          agentId,
          modelId: prefs?.defaultModelId,
          settings,
        }),
      });
      const data = (await res.json()) as {
        item?: MediaLibraryItem;
        stub?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Generate failed');
      if (data.stub) toast.message('Stub clip saved — configure provider API keys for real video');
      else toast.success('Video saved to library');
      if (data.item) setPreview(data.item);
      await loadJobs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Clapperboard size={14} className="text-amber-400" />
        <span className="text-[11px] font-medium">Video Production</span>
        <span className="text-[10px] text-zinc-600">{context.surface}</span>
      </div>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-h-0 overflow-auto p-3 space-y-3">
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
          {prefs && models.length > 0 && (
            <VideoModelPicker
              models={models}
              primaryId={prefs.defaultModelId}
              backupId={prefs.backupModelId}
              onPrimaryChange={(id) => void savePrefs({ defaultModelId: id })}
              onBackupChange={(id) => void savePrefs({ backupModelId: id })}
            />
          )}
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[12px] outline-none focus:border-amber-500/40"
            placeholder="Describe the shot, motion, and mood…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          {refUrl && (
            <div className="text-[10px] text-zinc-500">
              Reference
              {refUrl.match(/\.(mp4|webm)|video/i) ? (
                <video src={refUrl} className="mt-1 max-h-24 rounded border border-white/10" controls muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={refUrl} alt="" className="mt-1 h-16 rounded border border-white/10" />
              )}
            </div>
          )}
          {settings && (
            <VideoProductionParamsPanel
              settings={settings}
              onChange={(next) => void persistSettings(next)}
            />
          )}
          <button
            type="button"
            disabled={generating}
            onClick={() => void generate()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2 text-[12px] font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {generating ? 'Rendering…' : 'Generate video'}
          </button>
          <div className="min-h-[180px] rounded-lg border border-white/10 bg-black/25 p-2">
            {preview && preview.mimeType.startsWith('video/') ? (
              <video src={preview.url} controls className="max-h-[240px] w-full" />
            ) : preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="" className="max-h-[240px] w-full object-contain" />
            ) : (
              <p className="py-10 text-center text-[11px] text-zinc-600">Program monitor</p>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
            Render queue
          </div>
          <ul className="min-h-0 flex-1 overflow-auto p-2 text-[10px]">
            {jobs.map((j) => (
              <li key={j.id} className="mb-2 rounded border border-white/5 bg-white/[0.02] p-2 text-zinc-400">
                <div className="flex justify-between text-zinc-300">
                  <span>{j.status}</span>
                  {j.progress != null && <span>{j.progress}%</span>}
                </div>
                <div className="line-clamp-2">{j.prompt}</div>
                <div className="mt-1 text-zinc-600">
                  {j.settings.frameRate} fps · {j.settings.durationSeconds}s · {j.settings.syncMode} sync
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="m-2 rounded border border-white/10 py-1.5 text-[10px] text-amber-300 hover:bg-white/5"
            onClick={() =>
              dispatchAgentNavigate({ toolId: 'media-library', agentId, mediaId: preview?.id })
            }
          >
            Open media library
          </button>
        </div>
      </div>
    </div>
  );
}