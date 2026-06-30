'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

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
  createdAt: string;
};

type JobRow = {
  id: string;
  workflowName: string;
  status: string;
  durationMs: number;
  createdAt: string;
};

type BindingState = {
  agentId: string;
  readScopes: Array<{ kind: string; id?: string }>;
  writeScopes: Array<{ kind: string; id?: string }>;
  defaultPartition?: string;
};

export function MemoryConsoleView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<{ documentCount: number; store: string } | null>(null);
  const [workflows, setWorkflows] = useState<{ ingest: { id: string } | null; recall: { id: string } | null } | null>(null);
  const [ingestText, setIngestText] = useState('');
  const [recallQuery, setRecallQuery] = useState('');
  const [recallHits, setRecallHits] = useState<Array<{ text: string; score: number }>>([]);
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [agentId, setAgentId] = useState('default');
  const [binding, setBinding] = useState<BindingState | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        fetch('/api/memory/stats').then((r) => r.json()),
        fetch('/api/memory/workflows').then((r) => r.json()),
      ]);
      setStats(s);
      setWorkflows(w);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load memory stats');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCorpus = useCallback(async () => {
    const res = await fetch('/api/memory/chunks?limit=40');
    const json = await res.json();
    setChunks(json.chunks ?? []);
  }, []);

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
  }, [refresh]);

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
        body: JSON.stringify({ text: ingestText, scopeKind: 'global', sourceKind: 'domain' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Ingest failed');
      toast.success(`Ingest completed (run ${json.workflowRunId?.slice(0, 8) ?? '—'})`);
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <Brain size={15} className="text-zinc-300" />
          </div>
          <div>
            <div className="text-sm font-medium text-zinc-100">Agent Memory</div>
            <div className="text-[10px] text-zinc-500">
              {context.surface} · Chroma + workflow designer
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded border border-white/10 p-1.5 text-zinc-400 hover:bg-white/5"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-1 border-b border-white/10 px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded px-2.5 py-1 text-[11px] ${
              tab === t.id ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 text-xs text-zinc-300">
        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Store</div>
              <div className="mt-1 text-sm text-zinc-100">{stats?.store ?? '—'}</div>
              <div className="mt-2 text-zinc-400">Documents: {stats?.documentCount ?? '—'}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Workflows</div>
              <p className="mt-2 text-zinc-400">
                Ingest: {workflows?.ingest?.id ?? 'not seeded'}
              </p>
              <p className="text-zinc-400">Recall: {workflows?.recall?.id ?? 'not seeded'}</p>
              <p className="mt-2 text-[10px] text-zinc-600">
                Open the Workflow panel to edit nodes, export, and redeploy.
              </p>
            </div>
          </div>
        )}

        {tab === 'corpus' && (
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
                  </tr>
                </thead>
                <tbody>
                  {chunks.map((c) => (
                    <tr key={c.id} className="border-t border-white/5">
                      <td className="py-1.5 pr-2 text-zinc-200">{c.contentExcerpt}</td>
                      <td className="py-1.5 text-zinc-500">
                        {c.scopeKind}
                        {c.scopeId ? `:${c.scopeId}` : ''}
                      </td>
                      <td className="py-1.5 text-zinc-500">{c.sourceKind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'bindings' && (
          <div className="space-y-3">
            <label className="block text-zinc-500">
              Agent ID
              <input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                onBlur={() => void loadBinding(agentId)}
                className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1"
              />
            </label>
            {binding && (
              <>
                <textarea
                  value={JSON.stringify(binding.readScopes, null, 2)}
                  onChange={(e) => {
                    try {
                      const readScopes = JSON.parse(e.target.value) as BindingState['readScopes'];
                      setBinding({ ...binding, readScopes });
                    } catch {
                      /* ignore while typing */
                    }
                  }}
                  className="h-24 w-full rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px]"
                />
                <textarea
                  value={JSON.stringify(binding.writeScopes, null, 2)}
                  onChange={(e) => {
                    try {
                      const writeScopes = JSON.parse(e.target.value) as BindingState['writeScopes'];
                      setBinding({ ...binding, writeScopes });
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="h-20 w-full rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px]"
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

        {tab === 'ingest' && (
          <div className="space-y-3">
            <p className="text-zinc-500">
              Runs the seeded <strong className="text-zinc-300">Memory Ingest (linear)</strong> workflow
              (shard → tag → embed → Chroma).
            </p>
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

        {tab === 'recall' && (
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
          </div>
        )}

        {tab === 'jobs' && (
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
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}