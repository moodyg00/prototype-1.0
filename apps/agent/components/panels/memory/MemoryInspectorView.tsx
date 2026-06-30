'use client';

import React, { useCallback, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

export function MemoryInspectorView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [agentId, setAgentId] = useState('default');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Array<{ text: string; score: number }>>([]);
  const [loading, setLoading] = useState(false);

  const runRecall = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/memory/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: 5, agentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Recall failed');
      setHits(json.hits ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Recall failed');
    } finally {
      setLoading(false);
    }
  }, [agentId, query]);

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-600">
        Memory inspector · {context.surface}
      </div>
      <input
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
        className="rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-200"
        placeholder="agent id"
      />
      <div className="flex gap-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void runRecall()}
          className="min-w-0 flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px]"
          placeholder="Quick recall…"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void runRecall()}
          className="rounded border border-white/10 p-1.5 hover:bg-white/5"
          aria-label="Search"
        >
          <Search size={14} className="text-zinc-400" />
        </button>
      </div>
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {hits.map((h, i) => (
          <li key={i} className="rounded border border-white/10 p-2 text-[10px]">
            <span className="text-zinc-600">{h.score.toFixed(3)}</span>
            <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-zinc-300">{h.text}</p>
          </li>
        ))}
        {!hits.length && (
          <li className="text-[10px] text-zinc-600">Top hits appear here for side-by-side debugging.</li>
        )}
      </ul>
    </div>
  );
}