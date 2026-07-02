'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';

import {
  AGENT_MEDIA_REFERENCE_EVENT,
  dispatchAgentNavigate,
  type AgentMediaReferenceDetail,
} from '@/lib/agent-navigation';
import { fetchJson } from '@/lib/memory/fetch-json';
import type { AgentImageModelPrefs } from '@prototype/ide-tools/image-models';
import type { ImageModelOption } from '@prototype/ide-tools/image-models';
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

interface PhotographyContextValue {
  agentId: string;
  setAgentId: (id: string) => void;
  agentIds: string[];
  models: ModelRow[];
  prefs: AgentImageModelPrefs | null;
  prompt: string;
  setPrompt: (v: string) => void;
  negative: string;
  setNegative: (v: string) => void;
  aspect: string;
  setAspect: (v: string) => void;
  preview: MediaLibraryItem | null;
  jobs: JobRow[];
  generating: boolean;
  refUrl: string | null;
  savePrefs: (next: Partial<AgentImageModelPrefs>) => Promise<void>;
  generate: () => Promise<void>;
  loadJobs: () => Promise<void>;
}

const PhotographyContext = createContext<PhotographyContextValue | null>(null);

export function usePhotography(): PhotographyContextValue {
  const ctx = useContext(PhotographyContext);
  if (!ctx) throw new Error('usePhotography must be used within PhotographyProvider');
  return ctx;
}

export function PhotographyProvider({ children }: { children: React.ReactNode }) {
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

  const savePrefs = useCallback(async (next: Partial<AgentImageModelPrefs>) => {
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
  }, [agentId]);

  const generate = useCallback(async () => {
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
  }, [agentId, aspect, loadJobs, negative, prefs?.defaultModelId, prompt]);

  const value = useMemo(
    () => ({
      agentId,
      setAgentId,
      agentIds,
      models,
      prefs,
      prompt,
      setPrompt,
      negative,
      setNegative,
      aspect,
      setAspect,
      preview,
      jobs,
      generating,
      refUrl,
      savePrefs,
      generate,
      loadJobs,
    }),
    [
      agentId,
      agentIds,
      aspect,
      generate,
      generating,
      jobs,
      loadJobs,
      models,
      negative,
      prefs,
      preview,
      prompt,
      refUrl,
      savePrefs,
    ],
  );

  return <PhotographyContext.Provider value={value}>{children}</PhotographyContext.Provider>;
}

export function PhotographyOpenLibraryButton() {
  const { agentId } = usePhotography();
  return (
    <button
      type="button"
      className="m-2 rounded border border-white/10 py-1.5 text-[10px] text-violet-300 hover:bg-white/5"
      onClick={() => dispatchAgentNavigate({ toolId: 'media-library', agentId })}
    >
      Open media library
    </button>
  );
}
