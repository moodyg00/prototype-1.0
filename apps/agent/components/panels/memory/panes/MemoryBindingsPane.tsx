'use client';

import { useEffect } from 'react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { ScopeMatrix } from '../ScopeMatrix';
import { useMemory } from '../MemoryProvider';
import { MemoryLoadingSkeleton, MemoryPaneShell } from '../memory-pane-utils';

export function MemoryBindingsPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    initialLoad,
    agentId,
    setAgentId,
    knownAgents,
    binding,
    setBinding,
    loadBinding,
    saveBinding,
  } = useMemory();

  useEffect(() => {
    void loadBinding(agentId);
  }, [agentId, loadBinding]);

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
        <label className="block text-zinc-500">
          Agent ID
          <input
            list="memory-agent-ids-bindings"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            onBlur={() => void loadBinding(agentId)}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 outline-none transition-colors focus:border-violet-500/50"
          />
          <datalist id="memory-agent-ids-bindings">
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
                className="mt-1 w-full rounded border border-white/10 bg-black/40 px-2 py-1 outline-none transition-colors focus:border-violet-500/50"
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
              className="rounded border border-white/10 px-3 py-1.5 text-[11px] transition-colors hover:bg-white/5"
            >
              Save bindings
            </button>
          </>
        )}
      </div>
    </MemoryPaneShell>
  );
}
