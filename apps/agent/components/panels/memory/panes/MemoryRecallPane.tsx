'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useMemory } from '../MemoryProvider';
import { MemoryLoadingSkeleton, MemoryPaneShell } from '../memory-pane-utils';

export function MemoryRecallPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    initialLoad,
    loading,
    recallQuery,
    setRecallQuery,
    recallHits,
    contextPreview,
    runRecall,
  } = useMemory();

  if (initialLoad) {
    return (
      <MemoryPaneShell>
        <MemoryLoadingSkeleton />
      </MemoryPaneShell>
    );
  }

  return (
    <MemoryPaneShell>
      <div className="space-y-3">
        <input
          value={recallQuery}
          onChange={(e) => setRecallQuery(e.target.value)}
          placeholder="Recall query…"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs outline-none transition-colors focus:border-violet-500/50"
        />
        <button
          type="button"
          disabled={loading || !recallQuery.trim()}
          onClick={() => void runRecall()}
          className="rounded border border-white/10 px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5 disabled:opacity-40"
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
    </MemoryPaneShell>
  );
}
