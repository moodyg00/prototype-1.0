'use client';

import { Info } from 'lucide-react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { MediaDetailDrawer } from '../MediaDetailDrawer';
import { useMediaLibrary } from '../MediaLibraryProvider';

/** Inline detail inspector — no overlay drawer chrome, just fills the Pane. */
export function DetailPane({ context }: { context: PaneRenderContext }) {
  const { selected, select, refresh } = useMediaLibrary();

  if (!selected) {
    return (
      <div
        className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-zinc-950 text-zinc-600"
        data-pane-instance={context.instanceId}
      >
        <Info size={16} />
        <span className="text-[11px]">Select an item to inspect it</span>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0" data-pane-instance={context.instanceId}>
      <MediaDetailDrawer
        item={selected}
        onClose={() => select(null)}
        onUpdated={refresh}
        onDeleted={refresh}
        inline
      />
    </div>
  );
}
