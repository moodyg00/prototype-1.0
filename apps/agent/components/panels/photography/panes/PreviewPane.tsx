'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { usePhotography } from '../PhotographyProvider';

export function PreviewPane({ context: _context }: { context: PaneRenderContext }) {
  const { preview } = usePhotography();

  return (
    <div className="flex h-full min-h-0 flex-col p-2">
      <div className="min-h-0 flex-1 rounded-lg border border-white/10 bg-black/20 p-2">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview.url} alt={preview.altText ?? ''} className="max-h-full w-full object-contain" />
        ) : (
          <p className="py-12 text-center text-[11px] text-zinc-600">Canvas preview</p>
        )}
      </div>
    </div>
  );
}
