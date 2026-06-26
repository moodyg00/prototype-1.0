"use client";

import React, { useState } from 'react';
import { AgentEvent, EventType } from '../lib/operators/types';
import { Brain, MousePointer, Eye, AlertTriangle, Camera, ListChecks, CheckCircle2 } from 'lucide-react';

interface EventStreamProps {
  events: AgentEvent[];
  running?: boolean;
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
}

// Event stream for operator (thought/action/observation/etc). Reusable for the visual browser.
const TYPE_META: Record<EventType, { icon: React.ComponentType<any>; color: string; label: string }> = {
  thought: { icon: Brain, color: 'text-amber-400', label: 'THOUGHT' },
  action: { icon: MousePointer, color: 'text-blue-400', label: 'ACTION' },
  observation: { icon: Eye, color: 'text-emerald-400', label: 'OBS' },
  error: { icon: AlertTriangle, color: 'text-red-400', label: 'ERROR' },
  screenshot: { icon: Camera, color: 'text-purple-400', label: 'SHOT' },
  plan: { icon: ListChecks, color: 'text-sky-400', label: 'PLAN' },
  result: { icon: CheckCircle2, color: 'text-emerald-300', label: 'RESULT' },
};

export function EventStream({ events, running, className = '', maxHeight = '100%', showFilters = true }: EventStreamProps) {
  const [filter, setFilter] = useState<'all' | EventType>('all');

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  const toggle = (t: 'all' | EventType) => setFilter(t);

  return (
    <div className={`card flex flex-col overflow-hidden ${className}`}>
      <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 text-xs flex-shrink-0">
        <div className="font-medium">Event Stream</div>
        <div className="text-[10px] text-zinc-500">MCP + vision + operator</div>
        {running && <div className="ml-auto text-blue-400 animate-pulse text-[10px]">agent acting…</div>}
      </div>

      {showFilters && (
        <div className="px-2 pt-2 flex flex-wrap gap-1 text-[10px] border-b border-white/5 pb-2">
          {(['all', 'thought', 'action', 'observation', 'error', 'screenshot', 'result'] as const).map(t => (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`px-2 py-0.5 rounded border ${filter === t ? 'bg-white/10 border-white/30 text-white' : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto p-2 space-y-1 text-xs font-mono bg-black/30" style={{ maxHeight }}>
        {filtered.length === 0 && (
          <div className="text-zinc-500 p-3 text-[11px]">No events yet. Run a task from the operator above.</div>
        )}
        {filtered.slice().reverse().map((e) => {
          const meta = TYPE_META[e.type];
          const Icon = meta.icon;
          const time = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return (
            <div key={e.id} className="flex gap-2 px-1.5 py-1 rounded hover:bg-white/5 border border-transparent hover:border-white/5">
              <div className={`mt-px ${meta.color}`}><Icon size={13} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`${meta.color} text-[10px] tracking-widest`}>{meta.label}</span>
                  <span className="text-[10px] text-zinc-600 tabular-nums">{time}</span>
                  {e.tool && <span className="text-[10px] text-zinc-500">· {e.tool}</span>}
                </div>
                <div className="text-emerald-300/90 leading-snug break-words pr-2">{e.content}</div>
                {e.screenshot && <div className="text-[10px] text-purple-400 mt-0.5">📸 screenshot attached to view</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-zinc-500 px-3 py-1.5 border-t border-white/10 bg-black/20">
        {events.length} events • powered by the visual browser operator primitives
      </div>
    </div>
  );
}
