'use client';

import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

const MOCK_PHOTOS = [
  'sunset-mountains.jpg',
  'beach-walk.heic',
  'family-dinner.png',
  'garden-macro.jpg',
  'city-night.raw',
];

export function PhotosListView({
  context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  return (
    <div className="flex h-full flex-col p-2">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">
        {context.surface} · {Math.round(context.bounds.width)}×{Math.round(context.bounds.height)}
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-auto">
        {MOCK_PHOTOS.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="w-full truncate rounded px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-white/5"
            >
              {name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}