'use client';

import React, { useEffect } from 'react';
import { Brain, RefreshCw } from 'lucide-react';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import type { PaneRenderContext } from '@/lib/pane-types';
import { useMemory, type MemoryTabId } from './MemoryProvider';
import {
  MemoryBindingsPane,
  MemoryCorpusPane,
  MemoryIngestPane,
  MemoryJobsPane,
  MemoryOverviewPane,
  MemoryRecallPane,
} from './panes/MemoryTabPanes';

const TABS: { id: MemoryTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'corpus', label: 'Corpus' },
  { id: 'ingest', label: 'Ingest' },
  { id: 'bindings', label: 'Bindings' },
  { id: 'recall', label: 'Recall lab' },
  { id: 'jobs', label: 'Jobs' },
];

const TAB_PANES: Record<MemoryTabId, React.ComponentType<{ context: PaneRenderContext }>> = {
  overview: MemoryOverviewPane,
  corpus: MemoryCorpusPane,
  ingest: MemoryIngestPane,
  bindings: MemoryBindingsPane,
  recall: MemoryRecallPane,
  jobs: MemoryJobsPane,
};

export function MemoryConsoleView({
  context,
  forcedTab,
  hideTabBar = false,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
  forcedTab?: MemoryTabId;
  hideTabBar?: boolean;
}) {
  const {
    tab,
    setTab,
    stats,
    agentId,
    setAgentId,
    knownAgents,
    loading,
    refresh,
    loadBinding,
  } = useMemory();

  useEffect(() => {
    if (forcedTab) setTab(forcedTab);
  }, [forcedTab, setTab]);

  const activeTab = forcedTab ?? tab;
  const TabPane = TAB_PANES[activeTab];
  const paneContext: PaneRenderContext = {
    placement: 'panel',
    paneId: `memory.${activeTab}`,
    featureId: 'memory',
    instanceId: context.containerId ?? 'memory-console',
    scopeId: `legacy-memory:${context.containerId ?? 'console'}`,
    bounds: context.bounds,
  };

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
          {(activeTab === 'corpus' || activeTab === 'bindings' || activeTab === 'recall') && (
            <>
              <input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                onBlur={() => activeTab === 'bindings' && void loadBinding(agentId)}
                list="memory-agent-ids-header"
                className="w-28 rounded border border-white/10 bg-black/40 px-2 py-1 text-[10px] text-zinc-300 outline-none transition-colors focus:border-violet-500/50"
                placeholder="agent id"
                title="Active agent scope"
              />
              <datalist id="memory-agent-ids-header">
                {knownAgents.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
            </>
          )}
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

      {!hideTabBar && !forcedTab ? (
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2">
          {TABS.map((t) => (
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
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        <TabPane context={paneContext} />
      </div>
    </div>
  );
}
