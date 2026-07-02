'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { dispatchAgentNavigate } from '@/lib/agent-navigation';
import type { AgentBrainSnapshot } from '@/lib/agents/brain-service';
import { useAgents } from '../AgentsProvider';
import { AgentsPaneShell } from '../agents-pane-utils';

export function AgentBrainPane({ context: _context }: { context: PaneRenderContext }) {
  const { selectedAgentId } = useAgents();
  const [brain, setBrain] = useState<AgentBrainSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!selectedAgentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(selectedAgentId)}/brain`);
      const json = (await res.json()) as AgentBrainSnapshot & { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Load failed');
      setBrain(json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Brain load failed');
      setBrain(null);
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function deleteEvent(eventId: string) {
    if (!selectedAgentId) return;
    try {
      const res = await fetch(
        `/api/agents/${encodeURIComponent(selectedAgentId)}/brain?eventId=${encodeURIComponent(eventId)}`,
        { method: 'DELETE' },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Delete failed');
      setBrain(json.brain ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function deleteChunk(chunkId: string) {
    try {
      const res = await fetch(`/api/memory/chunks/${encodeURIComponent(chunkId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete chunk failed');
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete chunk failed');
    }
  }

  if (!selectedAgentId) {
    return (
      <AgentsPaneShell title="Brain">
        <p className="text-[11px] text-zinc-500">Select an agent first.</p>
      </AgentsPaneShell>
    );
  }

  return (
    <AgentsPaneShell title="Brain">
      <div className="space-y-2 text-[10px]">
        <div className="flex flex-wrap items-center gap-2 text-zinc-500">
          <span>
            Store: <span className="text-zinc-300">{brain?.store.label ?? '—'}</span>
            {brain?.store.documentCount != null ? ` · ${brain.store.documentCount} docs` : ''}
          </span>
          <span>
            Events: {brain?.counts.events ?? '—'} ({brain?.counts.eventsListed ?? 0} shown) · Chunks:{' '}
            {brain?.counts.chunksAgentScope ?? '—'}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="ml-auto text-violet-400 hover:underline disabled:opacity-40"
          >
            Refresh
          </button>
        </div>

        <section>
          <h4 className="font-medium uppercase tracking-wide text-zinc-500">Memory events</h4>
          <div className="mt-1 max-h-32 overflow-auto rounded border border-zinc-800">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-zinc-900 text-zinc-500">
                <tr>
                  <th className="px-1 py-0.5">Type</th>
                  <th className="px-1 py-0.5">Content</th>
                  <th className="px-1 py-0.5" />
                </tr>
              </thead>
              <tbody>
                {(brain?.events ?? []).map((e) => (
                  <tr key={e.id} className="border-t border-zinc-800/80">
                    <td className="px-1 py-0.5 align-top text-zinc-400">{e.type}</td>
                    <td className="px-1 py-0.5 text-zinc-300">{e.content.slice(0, 120)}</td>
                    <td className="px-1 py-0.5 align-top">
                      <button
                        type="button"
                        className="text-red-400/80 hover:underline"
                        onClick={() => void deleteEvent(e.id)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!brain?.events.length ? (
              <p className="p-2 text-zinc-600">No events for this agent id.</p>
            ) : null}
          </div>
        </section>

        <section>
          <h4 className="font-medium uppercase tracking-wide text-zinc-500">Chunks (agent scope)</h4>
          <div className="mt-1 max-h-32 overflow-auto rounded border border-zinc-800">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-zinc-900 text-zinc-500">
                <tr>
                  <th className="px-1 py-0.5">Excerpt</th>
                  <th className="px-1 py-0.5">Status</th>
                  <th className="px-1 py-0.5" />
                </tr>
              </thead>
              <tbody>
                {(brain?.chunks ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-zinc-800/80">
                    <td className="px-1 py-0.5 text-zinc-300">{c.contentExcerpt.slice(0, 100)}</td>
                    <td className="px-1 py-0.5 text-zinc-500">{c.status}</td>
                    <td className="px-1 py-0.5">
                      <button
                        type="button"
                        className="text-red-400/80 hover:underline"
                        onClick={() => void deleteChunk(c.id)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!brain?.chunks.length ? (
              <p className="p-2 text-zinc-600">No catalogued chunks in agent scope.</p>
            ) : null}
          </div>
        </section>

        <button
          type="button"
          className="text-violet-400 hover:underline"
          onClick={() =>
            dispatchAgentNavigate({
              toolId: 'memory',
              agentId: selectedAgentId,
              memoryTab: 'overview',
            })
          }
        >
          Open Memory overview
        </button>
      </div>
    </AgentsPaneShell>
  );
}