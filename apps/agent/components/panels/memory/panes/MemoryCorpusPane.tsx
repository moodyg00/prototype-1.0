'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { dispatchAgentNavigate, setPendingRunId } from '@/lib/agent-navigation';
import { useMemory } from '../MemoryProvider';
import { MemoryLoadingSkeleton, MemoryPaneShell } from '../memory-pane-utils';

export function MemoryCorpusPane({ context: _context }: { context: PaneRenderContext }) {
  const { initialLoad, chunks, selectedChunk, setSelectedChunk, loadCorpus, deleteChunk } = useMemory();

  useEffect(() => {
    void loadCorpus();
  }, [loadCorpus]);

  if (initialLoad) {
    return (
      <MemoryPaneShell>
        <MemoryLoadingSkeleton />
      </MemoryPaneShell>
    );
  }

  return (
    <MemoryPaneShell>
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
                  className="cursor-pointer border-t border-white/5 hover:bg-white/5"
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
              onClick={() => void deleteChunk(selectedChunk.id)}
            >
              Delete chunk
            </button>
          </div>
        )}
      </div>
    </MemoryPaneShell>
  );
}
