'use client';

import { Database, GitBranch, Search } from 'lucide-react';
import { toast } from 'sonner';

import type { PaneRenderContext } from '@/lib/pane-types';
import { dispatchAgentNavigate, setPendingWorkflowId } from '@/lib/agent-navigation';
import { useMemory } from '../MemoryProvider';
import { MemoryLoadingSkeleton, MemoryPaneShell, shortId, StatCard } from '../memory-pane-utils';

export function MemoryOverviewPane({ context: _context }: { context: PaneRenderContext }) {
  const { initialLoad, stats, scopeStats, workflows, setTab } = useMemory();

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
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Vector store"
            icon={Database}
            value={stats?.store ?? '—'}
            hint={`${stats?.documentCount ?? 0} document${stats?.documentCount === 1 ? '' : 's'} indexed`}
          />
          <StatCard
            label="Scopes"
            icon={Search}
            value={scopeStats.length ? `${scopeStats.length} active` : 'None yet'}
            hint={
              scopeStats[0]
                ? `Top: ${scopeStats[0].scopeKind}${scopeStats[0].scopeId ? `:${scopeStats[0].scopeId}` : ''}`
                : 'Run ingest to populate'
            }
          />
        </div>

        {scopeStats.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {scopeStats.slice(0, 10).map((s) => (
              <span
                key={`${s.scopeKind}:${s.scopeId ?? ''}`}
                className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[10px] text-zinc-400"
              >
                {s.scopeKind}
                {s.scopeId ? `:${s.scopeId}` : ''}
                <span className="ml-1 text-zinc-600">({s.count})</span>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
            <GitBranch size={12} className="text-sky-400/80" />
            Workflows
          </div>
          {!workflows?.ingest?.id && !workflows?.recall?.id ? (
            <div className="mt-3 space-y-2">
              <p className="text-zinc-500">Memory workflows are not seeded yet.</p>
              <code className="block rounded border border-white/10 bg-black/40 px-2 py-1.5 text-[10px] text-zinc-400">
                cd apps/agent && BASE_URL=http://localhost:3002 pnpm dlx tsx scripts/seed-memory-workflows.ts
              </code>
            </div>
          ) : (
            <>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400">Ingest</span>
                  <span className="font-mono text-[10px] text-emerald-400/90" title={workflows?.ingest?.id ?? undefined}>
                    {workflows?.ingest?.id ? shortId(workflows.ingest.id) : 'not seeded'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-400">Recall</span>
                  <span className="font-mono text-[10px] text-emerald-400/90" title={workflows?.recall?.id ?? undefined}>
                    {workflows?.recall?.id ? shortId(workflows.recall.id) : 'not seeded'}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {workflows?.ingest?.id && (
                  <button
                    type="button"
                    className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                    onClick={() => {
                      setPendingWorkflowId(workflows.ingest!.id);
                      dispatchAgentNavigate({ toolId: 'workflow', workflowId: workflows.ingest!.id });
                      toast.message('Open the Workflow tool to edit ingest graph');
                    }}
                  >
                    Open ingest workflow
                  </button>
                )}
                {workflows?.recall?.id && (
                  <button
                    type="button"
                    className="rounded border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                    onClick={() => {
                      setPendingWorkflowId(workflows.recall!.id);
                      dispatchAgentNavigate({ toolId: 'workflow', workflowId: workflows.recall!.id });
                    }}
                  >
                    Open recall workflow
                  </button>
                )}
                <button
                  type="button"
                  className="rounded border border-violet-500/25 bg-violet-500/10 px-2 py-1 text-[10px] text-violet-200 hover:bg-violet-500/15"
                  onClick={() => setTab('ingest')}
                >
                  Quick ingest
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </MemoryPaneShell>
  );
}
