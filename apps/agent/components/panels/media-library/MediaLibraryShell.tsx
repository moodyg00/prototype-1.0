'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { consumePendingMediaFocus } from '@/lib/agent-navigation';
import { fetchJson } from '@/lib/memory/fetch-json';
import { MediaDetailDrawer } from './MediaDetailDrawer';
import { MediaLibraryFilterBar } from './MediaLibraryFilterBar';
import { MediaLibraryGrid } from './MediaLibraryGrid';
import { DEFAULT_MEDIA_FILTERS, type MediaLibraryFilters, type MediaLibraryItem } from './types';
import { useMediaLibraryInfiniteQuery } from './useMediaLibraryInfiniteQuery';

type Facets = {
  libraryTypes: string[];
  origins: readonly string[];
  categories: Array<{ id: string; name: string; slug: string }>;
};

export function MediaLibraryShell({
  columnMinWidth,
  compactFilters,
  defaultAgentId,
}: {
  columnMinWidth: number;
  compactFilters?: boolean;
  defaultAgentId?: string;
}) {
  const [filters, setFilters] = useState<MediaLibraryFilters>(() => ({
    ...DEFAULT_MEDIA_FILTERS,
    agentId: defaultAgentId ?? '',
  }));
  const [facets, setFacets] = useState<Facets | null>(null);
  const [agentIds, setAgentIds] = useState<string[]>(['default']);
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadAgentId = filters.agentId || defaultAgentId || 'default';

  const { items, loading, error, hasMore, loadMore, refresh } = useMediaLibraryInfiniteQuery(filters);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    void (async () => {
      try {
        const f = await fetchJson<Facets>('/api/media/facets');
        setFacets(f);
      } catch {
        /* ignore */
      }
      try {
        const a = await fetchJson<{ agentIds: string[] }>('/api/memory/agents');
        if (a.agentIds?.length) setAgentIds(a.agentIds);
      } catch {
        /* ignore */
      }
      const pending = consumePendingMediaFocus();
      if (pending.agentId) {
        setFilters((prev) => ({ ...prev, agentId: pending.agentId! }));
      }
      if (pending.mediaId) {
        const one = await fetchJson<{ item: MediaLibraryItem }>(`/api/media/${pending.mediaId}`);
        if (one.item) setSelected(one.item);
      }
    })();
  }, []);

  const onUpload = useCallback(() => fileRef.current?.click(), []);

  const onFile = useCallback(
    async (file: File) => {
      const form = new FormData();
      form.set('file', file);
      form.set('agentId', uploadAgentId);
      try {
        const res = await fetch('/api/media', { method: 'POST', body: form });
        const data = (await res.json()) as { item?: MediaLibraryItem; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Upload failed');
        toast.success('Uploaded');
        refresh();
        if (data.item) setSelected(data.item);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Upload failed');
      }
    },
    [uploadAgentId, refresh],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = '';
        }}
      />
      <MediaLibraryFilterBar
        filters={filters}
        facets={facets}
        agentIds={agentIds}
        onChange={setFilters}
        onUpload={onUpload}
        compact={compactFilters}
      />
      <div className="flex min-h-0 flex-1">
        <MediaLibraryGrid
          items={items}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onSelect={setSelected}
          selectedId={selected?.id}
          columnMinWidth={columnMinWidth}
        />
        {selected && (
          <MediaDetailDrawer
            item={selected}
            onClose={() => setSelected(null)}
            onUpdated={refresh}
            onDeleted={refresh}
          />
        )}
      </div>
    </div>
  );
}