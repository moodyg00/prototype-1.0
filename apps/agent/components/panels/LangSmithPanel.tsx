"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Activity, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

interface RunSummary {
  id: string;
  name: string;
  runType: string;
  status: string;
  startTime: string | null;
  endTime: string | null;
  latencyMs: number | null;
  totalTokens: number | null;
  totalCost: number | null;
  error: string | null;
}

interface RunsResponse {
  configured: boolean;
  projectName?: string;
  runs?: RunSummary[];
  summary?: {
    count: number;
    totalTokens: number;
    totalCost: number;
    errorCount: number;
    avgLatencyMs: number | null;
  };
  error?: string;
}

const SMITH_URL = 'https://smith.langchain.com';

function fmtLatency(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtCost(cost: number): string {
  if (!cost) return '$0.00';
  return `$${cost.toFixed(cost < 0.01 ? 5 : 4)}`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function LangSmithPanel() {
  const [project, setProject] = useState('');
  const [data, setData] = useState<RunsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (projectName?: string) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (projectName) qs.set('project', projectName);
      const res = await fetch(`/api/langsmith/runs?${qs.toString()}`);
      const json = (await res.json()) as RunsResponse;
      setData(json);
      if (json.error && json.configured) toast.error(json.error);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load runs';
      toast.error(message);
      setData({ configured: true, error: message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = data?.summary;
  const runs = data?.runs ?? [];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center">
            <Activity size={15} className="text-zinc-300" />
          </div>
          <div className="min-w-0">
            <div className="text-sm text-zinc-100 font-medium truncate">LangSmith</div>
            <div className="text-[10px] text-zinc-500 truncate">
              {data?.projectName ? `Project: ${data.projectName}` : 'Run traces, latency & cost'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            value={project}
            onChange={e => setProject(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void load(project || undefined); }}
            className="input text-xs w-40"
            placeholder="project name"
          />
          <button onClick={() => load(project || undefined)} disabled={loading} className="btn btn-ghost !p-1.5" title="Refresh">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <a href={SMITH_URL} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs" title="Open LangSmith">
            <ExternalLink size={12} /> Open
          </a>
        </div>
      </div>

      {/* Not configured */}
      {data && !data.configured ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <AlertTriangle size={22} className="text-amber-400" />
          <div className="text-sm text-zinc-200">LangSmith is not configured</div>
          <p className="text-[11px] text-zinc-500 max-w-sm">
            Set <code className="text-zinc-300">LANGCHAIN_API_KEY</code> (and optionally{' '}
            <code className="text-zinc-300">LANGCHAIN_PROJECT</code>) in the server environment to load
            traces, latency and cost. Keys stay server-side and are never sent to the browser.
          </p>
          <a href={SMITH_URL} target="_blank" rel="noreferrer" className="btn btn-ghost text-xs">
            <ExternalLink size={12} /> Open LangSmith
          </a>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Summary cards */}
          {summary && (
            <div className="grid grid-cols-4 gap-2 p-3 border-b border-white/5">
              <Stat label="Runs" value={String(summary.count)} />
              <Stat label="Avg latency" value={fmtLatency(summary.avgLatencyMs)} />
              <Stat label="Tokens" value={summary.totalTokens.toLocaleString()} />
              <Stat label="Cost" value={fmtCost(summary.totalCost)} />
            </div>
          )}

          {/* Runs table */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading && runs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">Loading runs…</div>
            ) : runs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-600">
                {data?.error ? data.error : 'No runs found for this project.'}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#09090b] border-b border-white/10">
                  <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="px-3 py-2 font-medium">Run</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Latency</th>
                    <th className="px-3 py-2 font-medium text-right">Tokens</th>
                    <th className="px-3 py-2 font-medium text-right">Cost</th>
                    <th className="px-3 py-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(run => (
                    <tr key={run.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-3 py-2 text-[11px] text-zinc-200 truncate max-w-40">{run.name}</td>
                      <td className="px-3 py-2 text-[11px] text-zinc-500 font-mono">{run.runType}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-medium ${run.error ? 'text-red-400' : 'text-emerald-400'}`}>
                          {run.error ? 'error' : run.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-zinc-300 text-right font-mono">{fmtLatency(run.latencyMs)}</td>
                      <td className="px-3 py-2 text-[11px] text-zinc-300 text-right font-mono">
                        {run.totalTokens != null ? run.totalTokens.toLocaleString() : '—'}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-zinc-300 text-right font-mono">
                        {run.totalCost != null ? fmtCost(run.totalCost) : '—'}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-zinc-500">{fmtTime(run.startTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
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
