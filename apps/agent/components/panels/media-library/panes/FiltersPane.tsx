'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { MediaLibraryFilterBar } from '../MediaLibraryFilterBar';
import { useMediaLibrary } from '../MediaLibraryProvider';

export function FiltersPane({ context }: { context: PaneRenderContext }) {
  const { filters, setFilters, facets, agentIds, triggerUploadPicker } = useMediaLibrary();
  return (
    <div className="h-full min-h-0 overflow-auto bg-zinc-950" data-pane-instance={context.instanceId}>
      <MediaLibraryFilterBar
        filters={filters}
        facets={facets}
        agentIds={agentIds}
        onChange={setFilters}
        onUpload={triggerUploadPicker}
        compact
      />
    </div>
  );
}
