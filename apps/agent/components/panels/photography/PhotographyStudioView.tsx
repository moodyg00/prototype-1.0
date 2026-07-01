'use client';

import { useCallback, useEffect, useState } from 'react';
import { ImageIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import {
  AGENT_MEDIA_REFERENCE_EVENT,
  dispatchAgentNavigate,
  type AgentMediaReferenceDetail,
} from '@/lib/agent-navigation';
import { fetchJson } from '@/lib/memory/fetch-json';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import type { AgentImageModelPrefs } from '@prototype/ide-tools';
import type { ImageModelOption } from '@prototype/ide-tools';
import { ModelPicker } from './ModelPicker';
import type { MediaLibraryItem } from '../media-library/types';

type ModelRow = ImageModelOption & { configured: boolean };

type JobRow = {
  id: string;
  prompt: string;
  status: string;
  mediaId?: string;
  stub?: boolean;
  createdAt: string;
};

export function PhotographyStudioView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [agentId, setAgentId] = useState('default');
  const [agentIds, setAgentIds] = useState<string[]>(['default']);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [prefs, setPrefs] = useState<AgentImageModelPrefs | null>(null);
  const [prompt, setPrompt] = useState('');
  const [negative, setNegative] = useState('');
  const [aspect, setAspect] = useState('1:1');
  const [preview, setPreview] = useState<MediaLibraryItem | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [generating, setGenerating] = useState(false);
  const [refUrl, setRefUrl] = useState<string | null>(null);

  const loadPrefs = useCallback(async (id: string) => {
    const data = await fetchJson<{ prefs: AgentImageModelPrefs; models: ModelRow[] }>(
      `/api/agents/${encodeURIComponent(id)}/image-models`,
    );
    setPrefs(data.prefs);
    setModels(data.models);
  }, []);

  const loadJobs = useCallback(async () => {
    const data = await fetchJson<{ jobs: JobRow[] }>(
      `/api/photography/jobs?agentId=${encodeURIComponent(agentId)}`,
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
        toast.message('Reference image attached');
      }
    };
    window.addEventListener(AGENT_MEDIA_REFERENCE_EVENT, handler);
    return () => window.removeEventListener(AGENT_MEDIA_REFERENCE_EVENT, handler);
  }, []);

  async function savePrefs(next: Partial<AgentImageModelPrefs>) {
    const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}/image-models`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      toast.error('Could not save model prefs');
      return;
    }
    const data = (await res.json()) as { prefs: AgentImageModelPrefs };
    setPrefs(data.prefs);
  }

  async function generate() {
    if (!prompt.trim()) {
      toast.error('Enter a prompt');
      return;
    }
    setGenerating(true);
    try {
      const fullPrompt = negative.trim()
        ? `${prompt.trim()} --no ${negative.trim()}`
        : prompt.trim();
      const res = await fetch('/api/photography/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          agentId,
          modelId: prefs?.defaultModelId,
          aspect,
        }),
      });
      const data = (await res.json()) as {
        item?: MediaLibraryItem;
        stub?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Generate failed');
      if (data.stub) toast.message('Stub image saved (configure XAI_API_KEY or OPENAI_API_KEY)');
      else toast.success('Image saved to library');
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
        <ImageIcon size={14} className="text-violet-400" />
        <span className="text-[11px] font-medium">Photography Studio</span>
        <span className="text-[10px] text-zinc-600">{context.surface}</span>
      </div>
      <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-h-0 flex-col gap-3 overflow-auto p-3">
          <div className="flex flex-wrap gap-2">
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
            {['1:1', '16:9', '9:16', '3:2'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAspect(a)}
                className={`rounded px-2 py-1 text-[10px] ${
                  aspect === a ? 'bg-violet-600/80 text-white' : 'bg-white/5 text-zinc-400'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          {prefs && models.length > 0 && (
            <ModelPicker
              models={models}
              primaryId={prefs.defaultModelId}
              backupId={prefs.backupModelId}
              onPrimaryChange={(id) => void savePrefs({ defaultModelId: id })}
              onBackupChange={(id) => void savePrefs({ backupModelId: id })}
            />
          )}
          <textarea
            className="min-h-[88px] w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[12px] text-zinc-100 outline-none focus:border-violet-500/40"
            placeholder="Describe the image…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-zinc-400"
            placeholder="Negative prompt (optional)"
            value={negative}
            onChange={(e) => setNegative(e.target.value)}
          />
          {refUrl && (
            <div className="text-[10px] text-zinc-500">
              Reference:{' '}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refUrl} alt="" className="mt-1 h-16 rounded border border-white/10" />
            </div>
          )}
          <button
            type="button"
            disabled={generating}
            onClick={() => void generate()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-[12px] font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {generating ? 'Generating…' : 'Generate'}
          </button>
          <div className="min-h-[200px] flex-1 rounded-lg border border-white/10 bg-black/20 p-2">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.altText ?? ''} className="max-h-full w-full object-contain" />
            ) : (
              <p className="py-12 text-center text-[11px] text-zinc-600">Canvas preview</p>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
            Queue
          </div>
          <ul className="min-h-0 flex-1 overflow-auto p-2 text-[10px] text-zinc-400">
            {jobs.map((j) => (
              <li key={j.id} className="mb-2 rounded border border-white/5 bg-white/[0.02] p-2">
                <div className="text-zinc-300">{j.status}</div>
                <div className="line-clamp-2 text-zinc-500">{j.prompt}</div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="m-2 rounded border border-white/10 py-1.5 text-[10px] text-violet-300 hover:bg-white/5"
            onClick={() => dispatchAgentNavigate({ toolId: 'media-library', agentId })}
          >
            Open media library
          </button>
        </div>
      </div>
    </div>
  );
}