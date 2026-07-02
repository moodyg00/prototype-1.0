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
import type { AgentVideoModelPrefs, VideoModelOption, VideoProductionSettings } from '@prototype/ide-tools';
import type { MediaLibraryItem } from '../media-library/types';

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

interface VideoProductionContextValue {
  agentId: string;
  setAgentId: (id: string) => void;
  agentIds: string[];
  models: ModelRow[];
  prefs: AgentVideoModelPrefs | null;
  settings: VideoProductionSettings | null;
  prompt: string;
  setPrompt: (v: string) => void;
  preview: MediaLibraryItem | null;
  setPreview: (item: MediaLibraryItem | null) => void;
  jobs: JobRow[];
  generating: boolean;
  refUrl: string | null;
  savePrefs: (next: Partial<AgentVideoModelPrefs>) => Promise<void>;
  persistSettings: (next: VideoProductionSettings) => Promise<void>;
  generate: () => Promise<void>;
  loadJobs: () => Promise<void>;
  openMediaLibrary: () => void;
}

const VideoProductionContext = createContext<VideoProductionContextValue | null>(null);

export function useVideoProduction(): VideoProductionContextValue {
  const ctx = useContext(VideoProductionContext);
  if (!ctx) throw new Error('useVideoProduction must be used within VideoProductionProvider');
  return ctx;
}

export function VideoProductionProvider({ children }: { children: React.ReactNode }) {
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

  const savePrefs = useCallback(async (next: Partial<AgentVideoModelPrefs>) => {
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
  }, [agentId]);

  const persistSettings = useCallback(async (next: VideoProductionSettings) => {
    setSettings(next);
    await savePrefs({ productionDefaults: next });
  }, [savePrefs]);

  const generate = useCallback(async () => {
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
  }, [agentId, loadJobs, prefs?.defaultModelId, prompt, settings]);

  const openMediaLibrary = useCallback(() => {
    dispatchAgentNavigate({ toolId: 'media-library', agentId, mediaId: preview?.id });
  }, [agentId, preview?.id]);

  const value = useMemo(
    () => ({
      agentId,
      setAgentId,
      agentIds,
      models,
      prefs,
      settings,
      prompt,
      setPrompt,
      preview,
      setPreview,
      jobs,
      generating,
      refUrl,
      savePrefs,
      persistSettings,
      generate,
      loadJobs,
      openMediaLibrary,
    }),
    [
      agentId,
      agentIds,
      generate,
      generating,
      jobs,
      loadJobs,
      models,
      openMediaLibrary,
      persistSettings,
      prefs,
      preview,
      prompt,
      refUrl,
      savePrefs,
      settings,
    ],
  );

  return <VideoProductionContext.Provider value={value}>{children}</VideoProductionContext.Provider>;
}
