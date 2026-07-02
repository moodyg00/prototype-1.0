'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { PhotographyOpenLibraryButton, usePhotography } from '../PhotographyProvider';

export function QueuePane({ context: _context }: { context: PaneRenderContext }) {
  const { jobs } = usePhotography();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500">
        Queue
      </div>
      <ul className="min-h-0 flex-1 overflow-auto p-2 text-[10px] text-zinc-400">
        {jobs.map((j) => (
          <li key={j.id} className="mb-2 rounded border border-white/5 bg-white/[0.02] p-2">
            <div className="text-zinc-300">{j.status}</div>
            <div className="line-clamp-2 text-zinc-500">{j.prompt}</div>
          </li>
        ))}
      </ul>
      <PhotographyOpenLibraryButton />
    </div>
  );
}
