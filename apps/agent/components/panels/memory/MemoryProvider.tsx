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
  AGENT_NAVIGATE_EVENT,
  consumePendingMemoryFocus,
  dispatchAgentNavigate,
  setPendingRunId,
  setPendingWorkflowId,
  type AgentNavigateDetail,
} from '@/lib/agent-navigation';
import { fetchJson } from '@/lib/memory/fetch-json';

export type MemoryTabId = 'overview' | 'corpus' | 'ingest' | 'bindings' | 'recall' | 'jobs';

export type ChunkRow = {
  id: string;
  chromaId: string;
  scopeKind: string;
  scopeId: string | null;
  partition: string;
  sourceKind: string;
  contentExcerpt: string;
  workflowRunId: string | null;
  status: string;
  createdAt: string;
};

export type JobRow = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  durationMs: number;
  createdAt: string;
};

export type ScopeStat = { scopeKind: string; scopeId: string | null; count: number };

export type BindingState = {
  agentId: string;
  readScopes: Array<{ kind: string; id?: string }>;
  writeScopes: Array<{ kind: string; id?: string }>;
  defaultPartition?: string;
};

type WorkflowsState = { ingest: { id: string } | null; recall: { id: string } | null } | null;

interface MemoryContextValue {
  tab: MemoryTabId;
  setTab: (tab: MemoryTabId) => void;
  stats: { documentCount: number; store: string } | null;
  scopeStats: ScopeStat[];
  knownAgents: string[];
  workflows: WorkflowsState;
  ingestText: string;
  setIngestText: (v: string) => void;
  ingestScopeKind: 'global' | 'agent' | 'group';
  setIngestScopeKind: (v: 'global' | 'agent' | 'group') => void;
  ingestScopeId: string;
  setIngestScopeId: (v: string) => void;
  useReviewWorkflow: boolean;
  setUseReviewWorkflow: (v: boolean) => void;
  contextPreview: string;
  selectedChunk: ChunkRow | null;
  setSelectedChunk: (chunk: ChunkRow | null) => void;
  recallQuery: string;
  setRecallQuery: (v: string) => void;
  recallHits: Array<{ text: string; score: number }>;
  chunks: ChunkRow[];
  jobs: JobRow[];
  agentId: string;
  setAgentId: (id: string) => void;
  binding: BindingState | null;
  setBinding: React.Dispatch<React.SetStateAction<BindingState | null>>;
  loading: boolean;
  initialLoad: boolean;
  refresh: () => Promise<void>;
  loadCorpus: () => Promise<void>;
  loadJobs: () => Promise<void>;
  loadBinding: (id: string) => Promise<void>;
  runIngest: () => Promise<void>;
  runRecall: () => Promise<void>;
  saveBinding: () => Promise<void>;
  deleteChunk: (id: string) => Promise<void>;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function useMemory(): MemoryContextValue {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemory must be used within MemoryProvider');
  return ctx;
}

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<MemoryTabId>('overview');
  const [stats, setStats] = useState<{ documentCount: number; store: string } | null>(null);
  const [scopeStats, setScopeStats] = useState<ScopeStat[]>([]);
  const [knownAgents, setKnownAgents] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowsState>(null);
  const [ingestText, setIngestText] = useState('');
  const [ingestScopeKind, setIngestScopeKind] = useState<'global' | 'agent' | 'group'>('global');
  const [ingestScopeId, setIngestScopeId] = useState('');
  const [useReviewWorkflow, setUseReviewWorkflow] = useState(false);
  const [contextPreview, setContextPreview] = useState('');
  const [selectedChunk, setSelectedChunk] = useState<ChunkRow | null>(null);
  const [recallQuery, setRecallQuery] = useState('');
  const [recallHits, setRecallHits] = useState<Array<{ text: string; score: number }>>([]);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [agentId, setAgentId] = useState('default');
  const [binding, setBinding] = useState<BindingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [statsSettled, workflowsSettled, scopesSettled, agentsSettled] =
      await Promise.allSettled([
        fetchJson<{ documentCount: number; store: string; error?: string; hint?: string }>(
          '/api/memory/stats',
        ),
        fetchJson<WorkflowsState>('/api/memory/workflows'),
        fetchJson<{ scopes?: ScopeStat[]; hint?: string }>('/api/memory/scopes'),
        fetchJson<{ agentIds?: string[]; hint?: string }>('/api/memory/agents'),
      ]);

    if (statsSettled.status === 'fulfilled') {
      setStats(statsSettled.value);
    } else {
      setStats(null);
      const message =
        statsSettled.reason instanceof Error
          ? statsSettled.reason.message
          : 'Memory stats unavailable';
      toast.message(message, { duration: 12_000 });
    }

    if (workflowsSettled.status === 'fulfilled') setWorkflows(workflowsSettled.value);
    if (scopesSettled.status === 'fulfilled') {
      setScopeStats(scopesSettled.value.scopes ?? []);
      if (scopesSettled.value.hint) toast.message(scopesSettled.value.hint, { duration: 8000 });
    }
    if (agentsSettled.status === 'fulfilled') {
      setKnownAgents(agentsSettled.value.agentIds ?? []);
      if (agentsSettled.value.hint) toast.message(agentsSettled.value.hint, { duration: 8000 });
    }

    setLoading(false);
    setInitialLoad(false);
  }, []);

  const loadCorpus = useCallback(async () => {
    const params = new URLSearchParams({ limit: '40', scopeKind: 'agent', scopeId: agentId });
    const res = await fetch(`/api/memory/chunks?${params}`);
    const json = await res.json();
    setChunks(json.chunks ?? []);
  }, [agentId]);

  const loadJobs = useCallback(async () => {
    const res = await fetch('/api/memory/jobs?limit=30');
    const json = await res.json();
    setJobs(json.runs ?? []);
  }, []);

  const loadBinding = useCallback(async (id: string) => {
    const res = await fetch(`/api/memory/bindings/${encodeURIComponent(id)}`);
    const json = await res.json();
    setBinding(json);
  }, []);

  useEffect(() => {
    void refresh();
    const pending = consumePendingMemoryFocus();
    if (pending.agentId) setAgentId(pending.agentId);
    if (pending.tab) setTab(pending.tab);
  }, [refresh]);

  useEffect(() => {
    const onNav = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentNavigateDetail>).detail;
      if (detail?.toolId !== 'memory') return;
      if (detail.agentId) setAgentId(detail.agentId);
      if (detail.memoryTab) setTab(detail.memoryTab);
    };
    window.addEventListener(AGENT_NAVIGATE_EVENT, onNav);
    return () => window.removeEventListener(AGENT_NAVIGATE_EVENT, onNav);
  }, []);

  const runIngest = useCallback(async () => {
    if (!ingestText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ingestText,
          scopeKind: ingestScopeKind,
          scopeId: ingestScopeId || agentId,
          agentId,
          sourceKind: 'domain',
          useReviewWorkflow,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Ingest failed');
      if (json.mode === 'langgraph') {
        toast.message(
          json.message ??
            `Review workflow started. Thread ${json.threadId?.slice(0, 8) ?? '—'} — resume in Workflow → Runner.`,
        );
        if (json.workflowId) {
          setPendingWorkflowId(json.workflowId);
          dispatchAgentNavigate({ toolId: 'workflow', workflowId: json.workflowId });
        }
      } else {
        toast.success(`Ingest completed (run ${json.workflowRunId?.slice(0, 8) ?? '—'})`);
      }
      setIngestText('');
      await refresh();
      await loadCorpus();
      await loadJobs();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }, [ingestText, ingestScopeKind, ingestScopeId, agentId, useReviewWorkflow, refresh, loadCorpus, loadJobs]);

  const runRecall = useCallback(async () => {
    if (!recallQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: recallQuery, topK: 6, agentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Recall failed');
      setRecallHits(json.hits ?? []);
      setContextPreview(
        (json.hits ?? [])
          .map((h: { text: string; score: number }, i: number) => `### ${i + 1} (${h.score.toFixed(3)})\n${h.text}`)
          .join('\n\n'),
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Recall failed');
    } finally {
      setLoading(false);
    }
  }, [recallQuery, agentId]);

  const saveBinding = useCallback(async () => {
    if (!binding) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/bindings/${encodeURIComponent(agentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(binding),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setBinding(json);
      toast.success('Bindings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }, [binding, agentId]);

  const deleteChunk = useCallback(
    async (id: string) => {
      await fetch(`/api/memory/chunks/${id}`, { method: 'DELETE' });
      setSelectedChunk(null);
      await loadCorpus();
      toast.success('Chunk deleted');
    },
    [loadCorpus],
  );

  const value = useMemo(
    (): MemoryContextValue => ({
      tab,
      setTab,
      stats,
      scopeStats,
      knownAgents,
      workflows,
      ingestText,
      setIngestText,
      ingestScopeKind,
      setIngestScopeKind,
      ingestScopeId,
      setIngestScopeId,
      useReviewWorkflow,
      setUseReviewWorkflow,
      contextPreview,
      selectedChunk,
      setSelectedChunk,
      recallQuery,
      setRecallQuery,
      recallHits,
      chunks,
      jobs,
      agentId,
      setAgentId,
      binding,
      setBinding,
      loading,
      initialLoad,
      refresh,
      loadCorpus,
      loadJobs,
      loadBinding,
      runIngest,
      runRecall,
      saveBinding,
      deleteChunk,
    }),
    [
      tab,
      stats,
      scopeStats,
      knownAgents,
      workflows,
      ingestText,
      ingestScopeKind,
      ingestScopeId,
      useReviewWorkflow,
      contextPreview,
      selectedChunk,
      recallQuery,
      recallHits,
      chunks,
      jobs,
      agentId,
      binding,
      loading,
      initialLoad,
      refresh,
      loadCorpus,
      loadJobs,
      loadBinding,
      runIngest,
      runRecall,
      saveBinding,
      deleteChunk,
    ],
  );

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
}
