'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Brain, Database, GitBranch, RefreshCw, Search, Upload } from 'lucide-react';
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
import { ScopeMatrix } from './ScopeMatrix';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

type TabId = 'overview' | 'corpus' | 'ingest' | 'bindings' | 'recall' | 'jobs';

type ChunkRow = {
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

type JobRow = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  durationMs: number;
  createdAt: string;
};

type ScopeStat = { scopeKind: string; scopeId: string | null; count: number };

type BindingState = {
  agentId: string;
  readScopes: Array<{ kind: string; id?: string }>;
  writeScopes: Array<{ kind: string; id?: string }>;
  defaultPartition?: string;
};

function shortId(id: string | undefined | null): string {
  if (!id) return '—';
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
        <Icon size={12} className="text-violet-400/80" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-medium text-zinc-100">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-zinc-600">{hint}</div>}
    </div>
  );
}

export function MemoryConsoleView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<{ documentCount: number; store: string } | null>(null);
  const [scopeStats, setScopeStats] = useState<ScopeStat[]>([]);
  const [knownAgents, setKnownAgents] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<{ ingest: { id: string } | null; recall: { id: string } | null } | null>(null);
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
    try {
      const [s, w, scopes, agents] = await Promise.all([
        fetchJson<{ documentCount: number; store: string }>('/api/memory/stats'),
        fetchJson<typeof workflows>('/api/memory/workflows'),
        fetchJson<{ scopes?: ScopeStat[]; hint?: string }>('/api/memory/scopes'),
        fetchJson<{ agentIds?: string[]; hint?: string }>('/api/memory/agents'),
      ]);
      setStats(s);
      setWorkflows(w);
      setScopeStats(scopes.scopes ?? []);
      setKnownAgents(agents.agentIds ?? []);
      const hint = scopes.hint ?? agents.hint;
      if (hint) toast.message(hint, { duration: 8000 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load memory stats');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
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

  useEffect(() => {
    if (tab === 'corpus') void loadCorpus();
    if (tab === 'jobs') void loadJobs();
    if (tab === 'bindings') void loadBinding(agentId);
  }, [tab, agentId, loadCorpus, loadJobs, loadBinding]);

  async function runIngest() {
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
  }

  async function runRecall() {
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
  }

  async function saveBinding() {
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
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'corpus', label: 'Corpus' },
    { id: 'ingest', label: 'Ingest' },
    { id: 'bindings', label: 'Bindings' },
    { id: 'recall', label: 'Recall lab' },
    { id: 'jobs', label: 'Jobs' },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
            <Brain size={15} className="text-violet-300" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-100">Agent Memory</div>
            <div className="text-[10px] text-zinc-500">
              {context.surface} · {stats?.store === 'chroma' ? 'Chroma vector store' : 'Mock store (set CHROMA_URL)'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(tab === 'corpus' || tab === 'bindings' || tab === 'recall') && (
            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              onBlur={() => tab === 'bindings' && void loadBinding(agentId)}
              list="memory-agent-ids-header"
              className="w-28 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-300"
              placeholder="agent id"
              title="Active agent scope"
            />
          )}
          <datalist id="memory-agent-ids-header">
            {knownAgents.map((id) => (
              <option key={id} value={id} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5 disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded px-2.5 py-1 text-[11px] transition-colors ${
              tab === t.id
                ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25'
                : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-xs text-zinc-300">
        {initialLoad && (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-lg bg-white/5" />
            <div className="h-28 rounded-lg bg-white/5" />
          </div>
        )}

        {!initialLoad && tab === 'overview' && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Vector store"
                icon={Database}
                value={stats?.store ?? '—'}
                hint={`${stats?.documentCount ?? 0} document${stats?.documentCount === 1 ? '' : 's'} indexed`}
              />
              <StatCard
                label="Scopes"
                icon={Search}
                value={scopeStats.length ? `${scopeStats.length} active` : 'None yet'}
                hint={scopeStats[0] ? `Top: ${scopeStats[0].scopeKind}${scopeStats[0].scopeId ? `:${scopeStats[0].scopeId}` : ''}` : 'Run ingest to populate'}
              />
            </div>

            {scopeStats.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {scopeStats.slice(0, 10).map((s) => (
                  <span
                    key={`${s.scopeKind}:${s.scopeId ?? ''}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-zinc-400"
                  >
                    {s.scopeKind}
                    {s.scopeId ? `:${s.scopeId}` : ''}
                    <span className="ml-1 text-zinc-600">({s.count})</span>
                  </span>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
                <GitBranch size={12} className="text-sky-400/80" />
                Workflows
              </div>
              {!workflows?.ingest?.id && !workflows?.recall?.id ? (
                <div className="mt-3 space-y-2">
                  <p className="text-zinc-500">Memory workflows are not seeded yet.</p>
                  <code className="block rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] text-zinc-400">
                    cd apps/agent && BASE_URL=http://localhost:3002 pnpm dlx tsx scripts/seed-memory-workflows.ts
                  </code>
                </div>
              ) : (
                <>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Ingest</span>
                      <span className="font-mono text-[10px] text-emerald-400/90" title={workflows?.ingest?.id ?? undefined}>
                        {workflows?.ingest?.id ? shortId(workflows.ingest.id) : 'not seeded'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">Recall</span>
                      <span className="font-mono text-[10px] text-emerald-400/90" title={workflows?.recall?.id ?? undefined}>
                        {workflows?.recall?.id ? shortId(workflows.recall.id) : 'not seeded'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {workflows?.ingest?.id && (
                      <button
                        type="button"
                        className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                        onClick={() => {
                          setPendingWorkflowId(workflows.ingest!.id);
                          dispatchAgentNavigate({ toolId: 'workflow', workflowId: workflows.ingest!.id });
                          toast.message('Open the Workflow tool to edit ingest graph');
                        }}
                      >
                        Open ingest workflow
                      </button>
                    )}
                    {workflows?.recall?.id && (
                      <button
                        type="button"
                        className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                        onClick={() => {
                          setPendingWorkflowId(workflows.recall!.id);
                          dispatchAgentNavigate({ toolId: 'workflow', workflowId: workflows.recall!.id });
                        }}
                      >
                        Open recall workflow
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-200 hover:bg-violet-500/15"
                      onClick={() => setTab('ingest')}
                    >
                      Quick ingest
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {!initialLoad && tab === 'corpus' && (
          <div className="space-y-2">
            {chunks.length === 0 ? (
              <p className="text-zinc-500">No catalog chunks yet. Run an ingest workflow.</p>
            ) : (
              <table className="w-full text-left text-[11px]">
                <thead className="text-[10px] uppercase text-zinc-500">
                  <tr>
                    <th className="pb-1">Excerpt</th>
                    <th className="pb-1">Scope</th>
                    <th className="pb-1">Kind</th>
                    <th className="pb-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {chunks.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-white/5 cursor-pointer hover:bg-white/5"
                      onClick={() => setSelectedChunk(c)}
                    >
                      <td className="py-1.5 pr-2 text-zinc-200">{c.contentExcerpt}</td>
                      <td className="py-1.5 text-zinc-500">
                        {c.scopeKind}
                        {c.scopeId ? `:${c.scopeId}` : ''}
                      </td>
                      <td className="py-1.5 text-zinc-500">{c.sourceKind}</td>
                      <td className="py-1.5 text-zinc-600">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {selectedChunk && (
              <div className="mt-3 rounded border border-white/10 p-2">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>
                    {selectedChunk.id.slice(0, 8)}… · {selectedChunk.status}
                  </span>
                  <button type="button" className="text-zinc-400" onClick={() => setSelectedChunk(null)}>
                    Close
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-zinc-200">{selectedChunk.contentExcerpt}</p>
                {selectedChunk.workflowRunId && (
                  <button
                    type="button"
                    className="mt-2 text-[10px] text-sky-400 hover:underline"
                    onClick={() => {
                      setPendingRunId(selectedChunk.workflowRunId!);
                      dispatchAgentNavigate({ toolId: 'runs', runId: selectedChunk.workflowRunId! });
                      toast.message('Open the Runs tool to view ingest trace');
                    }}
                  >
                    Ingest run {selectedChunk.workflowRunId.slice(0, 8)}…
                  </button>
                )}
                <button
                  type="button"
                  className="mt-2 text-[10px] text-red-400 hover:underline"
                  onClick={async () => {
                    await fetch(`/api/memory/chunks/${selectedChunk.id}`, { method: 'DELETE' });
                    setSelectedChunk(null);
                    await loadCorpus();
                    toast.success('Chunk deleted');
                  }}
                >
                  Delete chunk
                </button>
              </div>
            )}
          </div>
        )}

        {!initialLoad && tab === 'bindings' && (
          <div className="space-y-3">
            <label className="block text-zinc-500">
              Agent ID
              <input
                list="memory-agent-ids"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                onBlur={() => void loadBinding(agentId)}
                className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1"
              />
              <datalist id="memory-agent-ids">
                {knownAgents.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </label>
            {binding && (
              <>
                <label className="block text-zinc-500">
                  Default partition
                  <input
                    value={binding.defaultPartition ?? 'default'}
                    onChange={(e) => setBinding({ ...binding, defaultPartition: e.target.value })}
                    className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1"
                  />
                </label>
                <ScopeMatrix
                  label="Read scopes"
                  agentId={agentId}
                  scopes={binding.readScopes}
                  onChange={(readScopes) => setBinding({ ...binding, readScopes })}
                />
                <ScopeMatrix
                  label="Write scopes"
                  agentId={agentId}
                  scopes={binding.writeScopes}
                  onChange={(writeScopes) => setBinding({ ...binding, writeScopes })}
                />
                <button
                  type="button"
                  onClick={() => void saveBinding()}
                  className="rounded border border-white/10 px-3 py-1.5 text-[11px] hover:bg-white/5"
                >
                  Save bindings
                </button>
              </>
            )}
          </div>
        )}

        {!initialLoad && tab === 'ingest' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 text-zinc-400">
              <Upload size={14} className="mt-0.5 shrink-0 text-violet-400" />
              <p>
                Runs the seeded <span className="text-zinc-200">Memory Ingest (linear)</span> workflow
                — shard → tag → embed → Chroma upsert.
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={ingestScopeKind}
                onChange={(e) => setIngestScopeKind(e.target.value as 'global' | 'agent' | 'group')}
                className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px]"
              >
                <option value="global">global</option>
                <option value="agent">agent</option>
                <option value="group">group</option>
              </select>
              {ingestScopeKind !== 'global' && (
                <input
                  value={ingestScopeId}
                  onChange={(e) => setIngestScopeId(e.target.value)}
                  placeholder="scope id"
                  className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px]"
                />
              )}
            </div>
            <label className="flex items-center gap-2 text-[11px] text-zinc-500">
              <input
                type="checkbox"
                checked={useReviewWorkflow}
                onChange={(e) => setUseReviewWorkflow(e.target.checked)}
              />
              Use review workflow (run from Workflow → Runner for interrupt)
            </label>
            <textarea
              value={ingestText}
              onChange={(e) => setIngestText(e.target.value)}
              placeholder="Paste knowledge to ingest…"
              className="h-32 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-zinc-200"
            />
            <button
              type="button"
              disabled={loading || !ingestText.trim()}
              onClick={() => void runIngest()}
              className="rounded bg-violet-600/80 px-3 py-1.5 text-[11px] text-white disabled:opacity-40"
            >
              Run ingest workflow
            </button>
          </div>
        )}

        {!initialLoad && tab === 'recall' && (
          <div className="space-y-3">
            <input
              value={recallQuery}
              onChange={(e) => setRecallQuery(e.target.value)}
              placeholder="Recall query…"
              className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              disabled={loading || !recallQuery.trim()}
              onClick={() => void runRecall()}
              className="rounded border border-white/10 px-3 py-1.5 text-[11px] hover:bg-white/5"
            >
              Search memory
            </button>
            <ul className="space-y-2">
              {recallHits.map((h, i) => (
                <li key={i} className="rounded border border-white/10 p-2">
                  <div className="text-[10px] text-zinc-500">score {h.score.toFixed(3)}</div>
                  <div className="mt-1 whitespace-pre-wrap text-zinc-200">{h.text}</div>
                </li>
              ))}
            </ul>
            {contextPreview && (
              <pre className="mt-2 whitespace-pre-wrap rounded border border-white/10 bg-black/30 p-2 text-[10px] text-zinc-400">
                {contextPreview}
              </pre>
            )}
          </div>
        )}

        {!initialLoad && tab === 'jobs' && (
          <div className="space-y-2">
            {jobs.length === 0 ? (
              <p className="text-zinc-500">No memory workflow runs yet.</p>
            ) : (
              jobs.map((j) => (
                <div key={j.id} className="rounded border border-white/10 px-2 py-1.5">
                  <div className="text-zinc-200">{j.workflowName}</div>
                  <div className="text-[10px] text-zinc-500">
                    {j.status} · {j.durationMs}ms · {new Date(j.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="text-[10px] text-sky-400 hover:underline"
                      onClick={() => {
                        setPendingRunId(j.id);
                        dispatchAgentNavigate({ toolId: 'runs', runId: j.id });
                      }}
                    >
                      View run
                    </button>
                    <button
                      type="button"
                      className="text-[10px] text-zinc-400 hover:underline"
                      onClick={() => {
                        setPendingWorkflowId(j.workflowId);
                        dispatchAgentNavigate({ toolId: 'workflow', workflowId: j.workflowId });
                      }}
                    >
                      Open workflow
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}