'use client';

import { Activity, RefreshCw, Trash2 } from 'lucide-react';

import { useRuns } from '../RunsProvider';
import {
  STATUS_COLORS,
  fmtDuration,
  fmtTime,
  type RunsCategoryFilter,
  type RunsStatusFilter,
} from '../runs-types';

const selectClass =
  'rounded border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-zinc-300 outline-none transition-colors focus:border-[rgba(57,255,20,0.35)]';

export function RunsListView() {
  const {
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    data,
    loading,
    load,
    clearAll,
    selectedRunId,
    setSelectedRunId,
  } = useRuns();

  const summary = data?.summary;
  const runs = data?.runs ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
            <Activity size={15} className="text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-zinc-100">Runs</div>
            <div className="truncate text-[10px] text-zinc-500">
              Native workflow traces — latency, tokens & status
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="btn btn-ghost !p-1.5"
            title="Refresh"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <button type="button" onClick={() => void clearAll()} className="btn btn-ghost !p-1.5" title="Clear history">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {summary ? (
        <div className="grid grid-cols-4 gap-2 border-b border-white/5 p-3">
          <Stat label="Runs" value={String(summary.count)} />
          <Stat label="Avg latency" value={fmtDuration(summary.avgDurationMs)} />
          <Stat label="Tokens" value={summary.totalTokens.toLocaleString()} />
          <Stat
            label="Errors"
            value={String(summary.errorCount)}
            accent={summary.errorCount ? 'text-red-400' : undefined}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-3 py-2">
        <label className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          Category
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as RunsCategoryFilter)}
            className={selectClass}
          >
            <option value="all">All workflows</option>
            <option value="memory">Memory workflows</option>
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RunsStatusFilter)}
            className={selectClass}
          >
            <option value="all">Any status</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
            <option value="interrupted">Interrupted</option>
          </select>
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && runs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">Loading runs…</div>
        ) : runs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <Activity size={20} className="text-zinc-600" />
            <div className="text-xs text-zinc-500">No runs match these filters</div>
            <p className="max-w-xs text-[11px] text-zinc-600">
              Execute any workflow from the Runner or Workflow studio and its trace will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="sticky top-0 border-b border-white/10 bg-[#09090b]">
              <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium">Workflow</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Latency</th>
                <th className="px-3 py-2 text-right font-medium">Nodes</th>
                <th className="px-3 py-2 text-right font-medium">Tokens</th>
                <th className="px-3 py-2 font-medium">Started</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`cursor-pointer border-b border-white/5 hover:bg-white/[0.03] ${
                    selectedRunId === run.id ? 'bg-[rgba(57,255,20,0.06)]' : ''
                  }`}
                >
                  <td className="max-w-48 truncate px-3 py-2 text-[11px] text-zinc-200">{run.workflowName}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] font-medium ${STATUS_COLORS[run.status] ?? 'text-zinc-400'}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-300">
                    {fmtDuration(run.durationMs)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-500">{run.nodeCount}</td>
                  <td className="px-3 py-2 text-right font-mono text-[11px] text-zinc-300">
                    {run.tokens ? run.tokens.toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-zinc-500">{fmtTime(run.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`text-sm font-semibold ${accent ?? 'text-zinc-100'}`}>{value}</div>
    </div>
  );
}
