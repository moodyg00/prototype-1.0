"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Activity, Brain, RefreshCw, Trash2, X } from 'lucide-react';

import { AGENT_NAVIGATE_EVENT, consumePendingRunId, type AgentNavigateDetail } from '@/lib/agent-navigation';

interface RunSummaryRow {
  id: string;
  workflowId: string;
  workflowName: string;
  version: number;
  status: string;
  output: string;
  errorText: string | null;
  durationMs: number;
  nodeCount: number;
  eventCount: number;
  tokens: number;
  createdAt: string;
}

interface RunsResponse {
  runs: RunSummaryRow[];
  summary: {
    count: number;
    totalTokens: number;
    errorCount: number;
    avgDurationMs: number | null;
  } | null;
  error?: string;
}

interface SerializedMessage { role: string; content: string }
interface SerializedState {
  input: string;
  output: string;
  messages: SerializedMessage[];
  memory: Record<string, unknown>;
  routeTo?: string;
  tokens: number;
}
interface RunEvent { node: string; update: SerializedState }
interface RunDetail extends RunSummaryRow {
  input: string;
  threadId: string | null;
  events: RunEvent[];
  state: SerializedState;
}

function fmtDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'text-emerald-400',
  interrupted: 'text-sky-400',
  error: 'text-red-400',
};

export function RunsPanel() {
  const [data, setData] = useState<RunsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [memoryFilter, setMemoryFilter] = useState(false);
  const [selected, setSelected] = useState<RunDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: '100' });
      if (memoryFilter) qs.set('memoryOnly', '1');
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
  }, [memoryFilter]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/runs/${id}`);
      const json = (await res.json()) as RunDetail & { error?: string };
      if (json.error) { toast.error(json.error); return; }
      setSelected(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load run');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const pending = consumePendingRunId();
    if (pending) void openDetail(pending);
    const onNav = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentNavigateDetail>).detail;
      if (detail?.toolId === 'runs' && detail.runId) void openDetail(detail.runId);
    };
    window.addEventListener(AGENT_NAVIGATE_EVENT, onNav);
    return () => window.removeEventListener(AGENT_NAVIGATE_EVENT, onNav);
  }, [openDetail]);

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
      setSelected(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to clear runs');
    }
  }, [load]);

  const summary = data?.summary;
  const runs = data?.runs ?? [];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
            <Activity size={15} className="text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium truncate">Runs</div>
            <div className="text-[10px] text-zinc-500 truncate">Native workflow traces — latency, tokens & status</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMemoryFilter((v) => !v)}
            className={`btn btn-ghost !px-2 !py-1 text-[10px] gap-1 ${memoryFilter ? 'text-violet-300' : ''}`}
            title="Show memory workflow runs only"
          >
            <Brain size={12} /> Memory
          </button>
          <button onClick={() => load()} disabled={loading} className="btn btn-ghost !p-1.5" title="Refresh">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={clearAll} className="btn btn-ghost !p-1.5" title="Clear history">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 flex flex-col">
          {summary && (
            <div className="grid grid-cols-4 gap-2 p-3 border-b border-white/5">
              <Stat label="Runs" value={String(summary.count)} />
              <Stat label="Avg latency" value={fmtDuration(summary.avgDurationMs)} />
              <Stat label="Tokens" value={summary.totalTokens.toLocaleString()} />
              <Stat label="Errors" value={String(summary.errorCount)} accent={summary.errorCount ? 'text-red-400' : undefined} />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && runs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading runs…</div>
            ) : runs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-6">
                <Activity size={20} className="text-zinc-600" />
                <div className="text-xs text-zinc-500">No runs yet</div>
                <p className="text-[11px] text-zinc-600 max-w-xs">
                  Execute any workflow from the Runner or Workflow panel and its trace will appear here automatically.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#09090b] border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2 font-medium">Workflow</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Latency</th>
                    <th className="px-3 py-2 font-medium text-right">Nodes</th>
                    <th className="px-3 py-2 font-medium text-right">Tokens</th>
                    <th className="px-3 py-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(run => (
                    <tr
                      key={run.id}
                      onClick={() => openDetail(run.id)}
                      className={`border-b border-white/5 hover:bg-white/[0.03] cursor-pointer ${selected?.id === run.id ? 'bg-white/[0.04]' : ''}`}
                    >
                      <td className="px-3 py-2 text-[11px] text-zinc-200 truncate max-w-48">{run.workflowName}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-medium ${STATUS_COLORS[run.status] ?? 'text-zinc-400'}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-zinc-300 text-right font-mono">{fmtDuration(run.durationMs)}</td>
                      <td className="px-3 py-2 text-[11px] text-zinc-500 text-right font-mono">{run.nodeCount}</td>
                      <td className="px-3 py-2 text-[11px] text-zinc-300 text-right font-mono">{run.tokens ? run.tokens.toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 text-[10px] text-zinc-500">{fmtTime(run.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail drawer */}
        {selected && (
          <div className="w-96 min-w-96 border-l border-white/10 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="min-w-0">
                <div className="text-xs text-zinc-100 truncate">{selected.workflowName}</div>
                <div className="text-[10px] text-zinc-500 font-mono">{selected.id.slice(0, 12)}…</div>
              </div>
              <div className="flex items-center gap-1">
                {selected.status === 'completed' && (
                  <button
                    type="button"
                    onClick={() => void sendToMemory(selected.id)}
                    className="btn btn-ghost !px-2 !py-1 text-[10px] gap-1"
                    title="Send trace to memory"
                  >
                    <Brain size={12} /> Memory
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="btn btn-ghost !p-1"><X size={14} /></button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {detailLoading && <div className="text-[11px] text-zinc-500">Loading…</div>}

              <div className="grid grid-cols-2 gap-2">
                <Stat label="Status" value={selected.status} accent={STATUS_COLORS[selected.status]} />
                <Stat label="Latency" value={fmtDuration(selected.durationMs)} />
                <Stat label="Tokens" value={selected.tokens ? selected.tokens.toLocaleString() : '—'} />
                <Stat label="Events" value={String(selected.eventCount)} />
              </div>

              {selected.input && (
                <Section title="Input">
                  <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap break-words bg-zinc-900/60 rounded border border-white/5 p-2">{selected.input}</pre>
                </Section>
              )}

              {selected.errorText ? (
                <Section title="Error">
                  <pre className="text-[11px] text-red-400 whitespace-pre-wrap break-words bg-red-500/10 rounded border border-red-500/20 p-2">{selected.errorText}</pre>
                </Section>
              ) : (
                <Section title="Output">
                  <pre className="text-[11px] text-zinc-200 whitespace-pre-wrap break-words bg-zinc-900/60 rounded border border-white/5 p-2">{selected.state?.output || '—'}</pre>
                </Section>
              )}

              <Section title={`Node Timeline (${selected.events?.length ?? 0})`}>
                <div className="space-y-1">
                  {(selected.events ?? []).map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="w-5 text-right text-zinc-600 font-mono">{i + 1}</span>
                      <span className="text-emerald-400">→</span>
                      <span className="text-zinc-300 font-mono">{ev.node}</span>
                      {ev.update?.output && <span className="text-zinc-600 truncate">{ev.update.output.slice(0, 40)}</span>}
                    </div>
                  ))}
                  {(!selected.events || selected.events.length === 0) && <div className="text-[11px] text-zinc-600">No events.</div>}
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5 pb-1 border-b border-white/5">{title}</div>
      {children}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-sm font-semibold ${accent ?? 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}
