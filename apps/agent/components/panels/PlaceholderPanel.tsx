import React from 'react';
import { WorkspaceDef } from '../../lib/workspaces';

export function PlaceholderPanel({ workspace }: { workspace: WorkspaceDef }) {
  const Icon = workspace.icon;
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={22} className="text-zinc-400" />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-200">{workspace.label}</div>
        <div className="text-xs text-zinc-500 mt-1 max-w-xs">{workspace.description}</div>
        {workspace.source && (
          <div className="mt-2 text-[10px] font-mono text-zinc-600">{workspace.source}</div>
        )}
      </div>
      <div className="px-3 py-1 rounded border border-white/10 text-[10px] text-zinc-500">Coming soon</div>
    </div>
  );
}
