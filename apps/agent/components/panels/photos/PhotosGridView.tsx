'use client';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

const MOCK_THUMBNAILS = Array.from({ length: 12 }, (_, i) => ({
  id: `thumb-${i + 1}`,
  label: `Photo ${i + 1}`,
}));

export function PhotosGridView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const cols = context.bounds.width >= 720 ? 4 : context.bounds.width >= 480 ? 3 : 2;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 text-[10px] uppercase tracking-wider text-zinc-600">
        {context.surface} · {Math.round(context.bounds.width)}×{Math.round(context.bounds.height)}
      </div>
      <div
        className="min-h-0 flex-1 gap-2 overflow-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {MOCK_THUMBNAILS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="flex aspect-square flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[10px] text-zinc-500 hover:border-white/20 hover:bg-white/8"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}