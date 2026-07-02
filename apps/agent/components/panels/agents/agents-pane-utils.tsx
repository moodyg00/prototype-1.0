'use client';

import type { ReactNode } from 'react';

export function AgentsPaneShell({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-auto p-3 text-zinc-200">
      {title ? (
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}

export function PhasePlaceholder({ phase, summary }: { phase: number; summary: string }) {
  return (
    <p className="rounded-md border border-dashed border-zinc-700/80 bg-zinc-900/40 px-3 py-4 text-[11px] leading-relaxed text-zinc-500">
      <span className="font-medium text-zinc-400">Phase {phase}.</span> {summary}
    </p>
  );
}