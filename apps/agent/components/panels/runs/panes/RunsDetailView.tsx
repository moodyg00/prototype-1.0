'use client';

import { Brain, X } from 'lucide-react';

import { useRuns } from '../RunsProvider';
import { STATUS_COLORS, fmtDuration, isMemoryWorkflowName } from '../runs-types';

export function RunsDetailView() {
  const { selected, selectedRunId, detailLoading, setSelectedRunId, sendToMemory } = useRuns();

  if (!selectedRunId) {
    return (
      <div className="flex h-full items-center justify-center border-l border-white/5 bg-zinc-950/40 p-6 text-center">
        <p className="max-w-xs text-xs text-zinc-600">Select a run from the list to inspect its trace.</p>
      </div>
    );
  }

  if (detailLoading && !selected) {
    return (
      <div className="flex h-full items-center justify-center border-l border-white/5 bg-zinc-950/40 text-[11px] text-zinc-500">
        Loading run…
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center border-l border-white/5 bg-zinc-950/40 p-6 text-center">
        <p className="text-xs text-zinc-600">Run not found.</p>
      </div>
    );
  }

  const canSendToMemory =
    selected.status === 'completed' && !isMemoryWorkflowName(selected.workflowName);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-l border-white/10 bg-[#09090b]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <div className="truncate text-xs text-zinc-100">{selected.workflowName}</div>
          <div className="font-mono text-[10px] text-zinc-500">{selected.id.slice(0, 12)}…</div>
        </div>
        <div className="flex items-center gap-1">
          {canSendToMemory ? (
            <button
              type="button"
              onClick={() => void sendToMemory(selected.id)}
              className="btn btn-ghost !px-2 !py-1 text-[10px] gap-1"
              title="Send trace to memory"
            >
              <Brain size={12} /> Memory
            </button>
          ) : null}
          <button type="button" onClick={() => setSelectedRunId(null)} className="btn btn-ghost !p-1" title="Clear selection">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Status" value={selected.status} accent={STATUS_COLORS[selected.status]} />
          <Stat label="Latency" value={fmtDuration(selected.durationMs)} />
          <Stat label="Tokens" value={selected.tokens ? selected.tokens.toLocaleString() : '—'} />
          <Stat label="Events" value={String(selected.eventCount)} />
        </div>

        {selected.input ? (
          <Section title="Input">
            <pre className="whitespace-pre-wrap break-words rounded border border-white/5 bg-zinc-900/60 p-2 text-[11px] text-zinc-300">
              {selected.input}
            </pre>
          </Section>
        ) : null}

        {selected.errorText ? (
          <Section title="Error">
            <pre className="whitespace-pre-wrap break-words rounded border border-red-500/20 bg-red-500/10 p-2 text-[11px] text-red-400">
              {selected.errorText}
            </pre>
          </Section>
        ) : (
          <Section title="Output">
            <pre className="whitespace-pre-wrap break-words rounded border border-white/5 bg-zinc-900/60 p-2 text-[11px] text-zinc-200">
              {selected.state?.output || '—'}
            </pre>
          </Section>
        )}

        <Section title={`Node Timeline (${selected.events?.length ?? 0})`}>
          <div className="space-y-1">
            {(selected.events ?? []).map((ev, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="w-5 text-right font-mono text-zinc-600">{i + 1}</span>
                <span className="text-emerald-400">→</span>
                <span className="font-mono text-zinc-300">{ev.node}</span>
                {ev.update?.output ? (
                  <span className="truncate text-zinc-600">{ev.update.output.slice(0, 40)}</span>
                ) : null}
              </div>
            ))}
            {(!selected.events || selected.events.length === 0) && (
              <div className="text-[11px] text-zinc-600">No events.</div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-1.5 border-b border-white/5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      {children}
    </section>
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
