'use client';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

const MOCK_STRIP = ['A', 'B', 'C', 'D', 'E', 'F'];

export function PhotosDrawerView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">
        {context.surface} · {Math.round(context.bounds.width)}×{Math.round(context.bounds.height)}
      </div>
      <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto">
        {MOCK_STRIP.map((label) => (
          <div
            key={label}
            className="flex h-full w-16 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-xs text-zinc-500"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}