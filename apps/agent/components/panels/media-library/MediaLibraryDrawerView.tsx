'use client';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import { MediaLibraryShell } from './MediaLibraryShell';

export function MediaLibraryDrawerView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const columnMinWidth = context.bounds.width >= 420 ? 110 : 96;
  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <MediaLibraryShell columnMinWidth={columnMinWidth} compactFilters />
    </div>
  );
}