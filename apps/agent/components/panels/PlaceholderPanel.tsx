import React from 'react';
import type { ToolDef } from '@/lib/tools';

export function PlaceholderPanel({ tool }: { tool: ToolDef }) {
  const Icon = tool.icon;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
        <Icon size={22} className="text-zinc-400" />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-200">{tool.label}</div>
        <div className="mt-1 max-w-xs text-xs text-zinc-500">{tool.description}</div>
        {tool.source ? (
          <div className="mt-2 font-mono text-[10px] text-zinc-600">{tool.source}</div>
        ) : null}
      </div>
      <div className="rounded border border-white/10 px-3 py-1 text-[10px] text-zinc-500">Coming soon</div>
    </div>
  );
}