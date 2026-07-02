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
  consumePendingRunId,
  type AgentNavigateDetail,
} from '@/lib/agent-navigation';
import type {
  RunDetail,
  RunsCategoryFilter,
  RunsResponse,
  RunsStatusFilter,
} from './runs-types';

interface RunsContextValue {
  categoryFilter: RunsCategoryFilter;
  setCategoryFilter: (value: RunsCategoryFilter) => void;
  statusFilter: RunsStatusFilter;
  setStatusFilter: (value: RunsStatusFilter) => void;
  data: RunsResponse | null;
  loading: boolean;
  load: () => Promise<void>;
  clearAll: () => Promise<void>;
  selectedRunId: string | null;
  setSelectedRunId: (id: string | null) => void;
  selected: RunDetail | null;
  detailLoading: boolean;
  sendToMemory: (runId: string) => Promise<void>;
}

const RunsContext = createContext<RunsContextValue | null>(null);

export function useRuns(): RunsContextValue {
  const ctx = useContext(RunsContext);
  if (!ctx) throw new Error('useRuns must be used within RunsProvider');
  return ctx;
}

export function RunsProvider({ children }: { children: React.ReactNode }) {
  const [categoryFilter, setCategoryFilter] = useState<RunsCategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<RunsStatusFilter>('all');
  const [data, setData] = useState<RunsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selected, setSelected] = useState<RunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '100' });
      if (categoryFilter === 'memory') qs.set('memoryOnly', '1');
      if (statusFilter !== 'all') qs.set('status', statusFilter);
      const res = await fetch(`/api/runs?${qs}`);
      const json = (await res.json()) as RunsResponse;
      setData(json);
      if (json.error) toast.error(json.error);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load runs';
      toast.error(message);
      setData({ runs: [], summary: null, error: message });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selectedRunId) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/runs/${selectedRunId}`);
        const json = (await res.json()) as RunDetail & { error?: string };
        if (cancelled) return;
        if (json.error) {
          toast.error(json.error);
          setSelected(null);
          return;
        }
        setSelected(json);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'Failed to load run');
          setSelected(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRunId]);

  useEffect(() => {
    const pending = consumePendingRunId();
    if (pending) setSelectedRunId(pending);

    const onNav = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentNavigateDetail>).detail;
      if (detail?.toolId === 'runs' && detail.runId) setSelectedRunId(detail.runId);
    };
    window.addEventListener(AGENT_NAVIGATE_EVENT, onNav);
    return () => window.removeEventListener(AGENT_NAVIGATE_EVENT, onNav);
  }, []);

  const sendToMemory = useCallback(async (runId: string) => {
    try {
      const res = await fetch('/api/memory/ingest-from-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, agentId: 'default', scopeKind: 'agent', scopeId: 'default' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      toast.success(`Sent trace to memory (${json.chunkCount ?? 0} chunks)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Send to memory failed');
    }
  }, []);

  const clearAll = useCallback(async () => {
    if (!confirm('Clear all run history? This cannot be undone.')) return;
    try {
      const res = await fetch('/api/runs', { method: 'DELETE' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      toast.success(`Cleared ${json.deleted} run(s)`);
      setSelectedRunId(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to clear runs');
    }
  }, [load]);

  const value = useMemo(
    (): RunsContextValue => ({
      categoryFilter,
      setCategoryFilter,
      statusFilter,
      setStatusFilter,
      data,
      loading,
      load,
      clearAll,
      selectedRunId,
      setSelectedRunId,
      selected,
      detailLoading,
      sendToMemory,
    }),
    [
      categoryFilter,
      statusFilter,
      data,
      loading,
      load,
      clearAll,
      selectedRunId,
      selected,
      detailLoading,
      sendToMemory,
    ],
  );

  return <RunsContext.Provider value={value}>{children}</RunsContext.Provider>;
}
