'use client';

import { ExternalLink } from 'lucide-react';

import { dispatchAgentNavigate } from '@/lib/agent-navigation';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import { MediaLibraryShell } from './MediaLibraryShell';

export function MediaLibraryPanelView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[11px] font-medium text-zinc-200">Media</span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] text-violet-300 hover:text-violet-200"
          onClick={() => dispatchAgentNavigate({ toolId: 'media-library', agentId: 'default' })}
        >
          <ExternalLink size={12} />
          Open library
        </button>
      </div>
      <MediaLibraryShell columnMinWidth={100} compactFilters defaultAgentId="default" />
    </div>
  );
}