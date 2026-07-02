'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { openAgentsStudio } from '@/lib/agent-navigation';
import type { WorkspaceAgent } from '@/lib/agents/types';

export function AgentHeaderSearch() {
  const [query, setQuery] = useState('');
  const [agents, setAgents] = useState<WorkspaceAgent[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch('/api/agents')
      .then((r) => r.json())
      .then((j: { agents?: WorkspaceAgent[] }) => setAgents(j.agents ?? []))
      .catch(() => setAgents([]));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents.slice(0, 8);
    return agents
      .filter((a) => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [agents, query]);

  const pick = useCallback((agentId: string) => {
    setQuery('');
    setOpen(false);
    openAgentsStudio(agentId);
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative hidden w-64 lg:block">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        className="input w-full pl-9"
        placeholder="Search agents…"
        aria-label="Search agents"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) pick(results[0].id);
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && results.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-auto rounded-md border border-white/10 bg-zinc-900 py-1 shadow-lg">
          {results.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="flex w-full flex-col px-3 py-1.5 text-left text-xs hover:bg-white/6"
                onClick={() => pick(a.id)}
              >
                <span className="text-zinc-200">{a.name}</span>
                <span className="font-mono text-[10px] text-zinc-500">{a.id}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}