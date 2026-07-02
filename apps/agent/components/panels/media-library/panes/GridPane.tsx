'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { MediaLibraryGrid } from '../MediaLibraryGrid';
import { useMediaLibrary } from '../MediaLibraryProvider';

function columnWidthForBounds(width: number, dense: boolean): number {
  if (dense) return width >= 600 ? 84 : 68;
  return width >= 900 ? 140 : width >= 520 ? 120 : 100;
}

export function GridPane({ context }: { context: PaneRenderContext }) {
  const { items, loading, hasMore, loadMore, select, selected } = useMediaLibrary();
  return (
    <div className="h-full min-h-0 bg-zinc-950" data-pane-instance={context.instanceId}>
      <MediaLibraryGrid
        items={items}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onSelect={select}
        selectedId={selected?.id}
        columnMinWidth={columnWidthForBounds(context.bounds.width, false)}
      />
    </div>
  );
}

/** Denser thumbnails variant — same data, smaller `columnMinWidth`. */
export function GridCompactPane({ context }: { context: PaneRenderContext }) {
  const { items, loading, hasMore, loadMore, select, selected } = useMediaLibrary();
  return (
    <div className="h-full min-h-0 bg-zinc-950" data-pane-instance={context.instanceId}>
      <MediaLibraryGrid
        items={items}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onSelect={select}
        selectedId={selected?.id}
        columnMinWidth={columnWidthForBounds(context.bounds.width, true)}
      />
    </div>
  );
}
