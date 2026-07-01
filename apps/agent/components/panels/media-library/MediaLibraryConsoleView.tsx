'use client';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import { MediaLibraryShell } from './MediaLibraryShell';

export function MediaLibraryConsoleView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const columnMinWidth = context.bounds.width >= 900 ? 140 : context.bounds.width >= 520 ? 120 : 100;
  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="border-b border-white/10 px-3 py-2 text-[11px] font-medium text-zinc-200">
        Media Library
      </div>
      <MediaLibraryShell columnMinWidth={columnMinWidth} />
    </div>
  );
}