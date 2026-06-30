'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { dispatchAgentNavigate, setPendingRunId } from '@/lib/agent-navigation';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

type JobRow = {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  errorText: string | null;
  createdAt: string;
};

export function MemoryQueueDrawer({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [runs, setRuns] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memory/jobs?limit=20');
      const json = await res.json();
      const all = (json.runs ?? []) as JobRow[];
      setRuns(all.filter((r) => r.status === 'error' || r.status === 'running' || r.status === 'interrupted'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">
          Memory queue · {Math.round(context.bounds.width)}px
        </span>
        <button type="button" onClick={() => void load()} className="p-1 text-zinc-500 hover:text-zinc-300">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {runs.length === 0 ? (
          <p className="text-[10px] text-zinc-600">No pending or failed memory runs.</p>
        ) : (
          runs.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setPendingRunId(r.id);
                dispatchAgentNavigate({ toolId: 'runs', runId: r.id });
              }}
              className="w-full rounded border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-1 text-[10px] text-zinc-300">
                {(r.status === 'error' || r.status === 'interrupted') && (
                  <AlertTriangle size={10} className="text-amber-500" />
                )}
                <span className="truncate">{r.workflowName}</span>
              </div>
              <div className="text-[9px] text-zinc-600">
                {r.status} · {new Date(r.createdAt).toLocaleTimeString()}
              </div>
              {r.errorText && (
                <div className="mt-0.5 line-clamp-2 text-[9px] text-red-400/80">{r.errorText}</div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}