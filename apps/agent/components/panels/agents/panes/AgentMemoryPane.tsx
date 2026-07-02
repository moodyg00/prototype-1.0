'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { dispatchAgentNavigate } from '@/lib/agent-navigation';
import { ScopeMatrix } from '@/components/panels/memory/ScopeMatrix';
import type { BindingState } from '@/components/panels/memory/MemoryProvider';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentMemoryPane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedAgentId } = useAgents();
  const [binding, setBinding] = useState<BindingState | null>(null);
  const [loading, setLoading] = useState(false);
  const [recallQuery, setRecallQuery] = useState('');
  const [recallHits, setRecallHits] = useState<Array<{ text: string; score: number }>>([]);
  const [ingestText, setIngestText] = useState('');

  const loadBinding = useCallback(async (agentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/bindings/${encodeURIComponent(agentId)}`);
      const json = (await res.json()) as BindingState;
      if (!res.ok) throw new Error('Failed to load bindings');
      setBinding(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bindings failed');
      setBinding(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedAgentId) return;
    void loadBinding(selectedAgentId);
    setRecallHits([]);
  }, [selectedAgentId, loadBinding]);

  async function saveBinding() {
    if (!binding || !selectedAgentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/memory/bindings/${encodeURIComponent(selectedAgentId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(binding),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Bindings saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  async function runRecall() {
    if (!recallQuery.trim() || !selectedAgentId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: recallQuery, topK: 6, agentId: selectedAgentId }),
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

  async function runQuickIngest() {
    if (!ingestText.trim() || !selectedAgentId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/memory/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ingestText,
          scopeKind: 'agent',
          scopeId: selectedAgentId,
          agentId: selectedAgentId,
          sourceKind: 'domain',
          useReviewWorkflow: false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Ingest failed');
      toast.success('Ingested into agent scope');
      setIngestText('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ingest failed');
    } finally {
      setLoading(false);
    }
  }

  if (!selectedAgentId) {
    return (
      <AgentsPaneShell title="Agent memory">
        <p className="text-[11px] text-zinc-500">Select an agent first.</p>
      </AgentsPaneShell>
    );
  }

  return (
    <AgentsPaneShell title="Agent memory">
      <div className="space-y-3 text-[11px]">
        {binding ? (
          <>
            <label className="block text-zinc-500">
              Default partition
              <input
                value={binding.defaultPartition ?? 'default'}
                onChange={(e) => setBinding({ ...binding, defaultPartition: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
              />
            </label>
            <ScopeMatrix
              label="Read scopes"
              agentId={selectedAgentId}
              scopes={binding.readScopes}
              onChange={(readScopes) => setBinding({ ...binding, readScopes })}
            />
            <ScopeMatrix
              label="Write scopes"
              agentId={selectedAgentId}
              scopes={binding.writeScopes}
              onChange={(writeScopes) => setBinding({ ...binding, writeScopes })}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void saveBinding()}
              className="rounded border border-zinc-600 px-2 py-1 text-[10px] hover:bg-zinc-800 disabled:opacity-40"
            >
              Save bindings
            </button>
          </>
        ) : (
          <p className="text-zinc-500">{loading ? 'Loading…' : 'No binding data.'}</p>
        )}

        <div className="border-t border-zinc-800 pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Recall lab</p>
          <input
            value={recallQuery}
            onChange={(e) => setRecallQuery(e.target.value)}
            placeholder="Query…"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-200"
          />
          <button
            type="button"
            disabled={loading || !recallQuery.trim()}
            onClick={() => void runRecall()}
            className="mt-1 rounded border border-zinc-600 px-2 py-1 text-[10px] hover:bg-zinc-800 disabled:opacity-40"
          >
            Search
          </button>
          <ul className="mt-2 max-h-28 space-y-1 overflow-auto">
            {recallHits.map((h, i) => (
              <li key={i} className="rounded border border-zinc-800 p-1.5 text-[10px]">
                <span className="text-zinc-500">{h.score.toFixed(3)}</span>
                <div className="text-zinc-300">{h.text.slice(0, 240)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-zinc-800 pt-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Quick ingest</p>
          <textarea
            value={ingestText}
            onChange={(e) => setIngestText(e.target.value)}
            placeholder="Paste text to index under this agent…"
            className="mt-1 min-h-[48px] w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200"
          />
          <button
            type="button"
            disabled={loading || !ingestText.trim()}
            onClick={() => void runQuickIngest()}
            className="mt-1 rounded border border-zinc-600 px-2 py-1 text-[10px] hover:bg-zinc-800 disabled:opacity-40"
          >
            Ingest
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-2">
          <button
            type="button"
            className="text-[10px] text-violet-400 hover:underline"
            onClick={() =>
              dispatchAgentNavigate({
                toolId: 'memory',
                agentId: selectedAgentId,
                memoryTab: 'corpus',
              })
            }
          >
            Open corpus
          </button>
          <button
            type="button"
            className="text-[10px] text-violet-400 hover:underline"
            onClick={() =>
              dispatchAgentNavigate({
                toolId: 'memory',
                agentId: selectedAgentId,
                memoryTab: 'ingest',
              })
            }
          >
            Open ingest jobs
          </button>
        </div>
      </div>
    </AgentsPaneShell>
  );
}