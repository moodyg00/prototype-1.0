'use client';

import { Upload } from 'lucide-react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useMemory } from '../MemoryProvider';
import { MemoryLoadingSkeleton, MemoryPaneShell } from '../memory-pane-utils';

export function MemoryIngestPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    initialLoad,
    loading,
    ingestText,
    setIngestText,
    ingestScopeKind,
    setIngestScopeKind,
    ingestScopeId,
    setIngestScopeId,
    useReviewWorkflow,
    setUseReviewWorkflow,
    runIngest,
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
        <div className="flex items-start gap-2 rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 text-zinc-400">
          <Upload size={14} className="mt-0.5 shrink-0 text-violet-400" />
          <p>
            Runs the seeded <span className="text-zinc-200">Memory Ingest (linear)</span> workflow — shard → tag →
            embed → Chroma upsert.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={ingestScopeKind}
            onChange={(e) => setIngestScopeKind(e.target.value as 'global' | 'agent' | 'group')}
            className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] outline-none transition-colors focus:border-violet-500/50"
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
              className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] outline-none transition-colors focus:border-violet-500/50"
            />
          )}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-500">
          <input
            type="checkbox"
            checked={useReviewWorkflow}
            onChange={(e) => setUseReviewWorkflow(e.target.checked)}
            className="h-3 w-3 accent-violet-500"
          />
          Use review workflow (run from Workflow → Runner for interrupt)
        </label>
        <textarea
          value={ingestText}
          onChange={(e) => setIngestText(e.target.value)}
          placeholder="Paste knowledge to ingest…"
          className="h-32 w-full resize-none rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-zinc-200 outline-none transition-colors focus:border-violet-500/50"
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
    </MemoryPaneShell>
  );
}
