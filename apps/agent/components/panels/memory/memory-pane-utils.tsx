'use client';

import React from 'react';

export function shortId(id: string | undefined | null): string {
  if (!id) return '—';
  return id.length <= 12 ? id : `${id.slice(0, 8)}…`;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-zinc-500">
        <Icon size={12} className="text-violet-400/80" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-medium text-zinc-100">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-zinc-600">{hint}</div>}
    </div>
  );
}

export function MemoryPaneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4 text-xs text-zinc-300">{children}</div>
  );
}

export function MemoryLoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-20 rounded-lg bg-white/5" />
      <div className="h-28 rounded-lg bg-white/5" />
    </div>
  );
}
