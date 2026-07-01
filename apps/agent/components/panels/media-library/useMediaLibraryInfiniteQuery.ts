'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchJson } from '@/lib/memory/fetch-json';
import type { MediaLibraryFilters, MediaLibraryItem } from './types';

type ListResponse = {
  items: MediaLibraryItem[];
  nextCursor: string | null;
  hasMore: boolean;
  error?: string;
};

function buildQuery(filters: MediaLibraryFilters, cursor?: string | null): string {
  const params = new URLSearchParams();
  params.set('source', 'agent');
  params.set('limit', '40');
  if (cursor) params.set('cursor', cursor);
  if (filters.libraryType) params.set('libraryType', filters.libraryType);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.agentId) params.set('agentId', filters.agentId);
  if (filters.mediaKind) params.set('mediaKind', filters.mediaKind);
  return `/api/media?${params.toString()}`;
}

export function useMediaLibraryInfiniteQuery(filters: MediaLibraryFilters) {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filtersKey = JSON.stringify(filters);
  const loadingRef = useRef(false);

  const loadPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<ListResponse>(buildQuery(filters, cursor));
        setItems((prev) => {
          if (!append) return data.items;
          const seen = new Set(prev.map((i) => i.id));
          const merged = [...prev];
          for (const item of data.items) {
            if (!seen.has(item.id)) merged.push(item);
          }
          return merged;
        });
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load media');
        if (!append) setItems([]);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [filtersKey, filters],
  );

  const refresh = useCallback(() => loadPage(null, false), [loadPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || !nextCursor || loading) return;
    void loadPage(nextCursor, true);
  }, [hasMore, nextCursor, loading, loadPage]);

  useEffect(() => {
    void loadPage(null, false);
  }, [loadPage]);

  return { items, loading, error, hasMore, loadMore, refresh };
}