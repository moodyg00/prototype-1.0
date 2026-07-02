'use client';

import { useEffect } from 'react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { dispatchAgentNavigate, setPendingRunId, setPendingWorkflowId } from '@/lib/agent-navigation';
import { useMemory } from '../MemoryProvider';
import { MemoryLoadingSkeleton, MemoryPaneShell } from '../memory-pane-utils';

export function MemoryJobsPane({ context: _context }: { context: PaneRenderContext }) {
  const { initialLoad, jobs, loadJobs } = useMemory();

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

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
        {jobs.length === 0 ? (
          <p className="text-zinc-500">No memory workflow runs yet.</p>
        ) : (
          jobs.map((j) => (
            <div key={j.id} className="rounded border border-white/10 px-2 py-1.5">
              <div className="text-zinc-200">{j.workflowName}</div>
              <div className="text-[10px] text-zinc-500">
                {j.status} · {j.durationMs}ms · {new Date(j.createdAt).toLocaleString()}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-[10px] text-sky-400 hover:underline"
                  onClick={() => {
                    setPendingRunId(j.id);
                    dispatchAgentNavigate({ toolId: 'runs', runId: j.id });
                  }}
                >
                  View run
                </button>
                <button
                  type="button"
                  className="text-[10px] text-zinc-400 hover:underline"
                  onClick={() => {
                    setPendingWorkflowId(j.workflowId);
                    dispatchAgentNavigate({ toolId: 'workflow', workflowId: j.workflowId });
                  }}
                >
                  Open workflow
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </MemoryPaneShell>
  );
}
