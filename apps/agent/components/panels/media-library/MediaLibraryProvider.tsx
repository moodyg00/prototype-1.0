'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { consumePendingMediaFocus } from '@/lib/agent-navigation';
import { fetchJson } from '@/lib/memory/fetch-json';
import { DEFAULT_MEDIA_FILTERS, type MediaLibraryFilters, type MediaLibraryItem } from './types';
import { useMediaLibraryInfiniteQuery } from './useMediaLibraryInfiniteQuery';

export type MediaFacets = {
  libraryTypes: string[];
  origins: readonly string[];
  mediaKinds?: readonly string[];
  categories: Array<{ id: string; name: string; slug: string }>;
};

interface MediaLibraryContextValue {
  filters: MediaLibraryFilters;
  setFilters: (next: MediaLibraryFilters) => void;
  facets: MediaFacets | null;
  agentIds: string[];
  items: MediaLibraryItem[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  selected: MediaLibraryItem | null;
  select: (item: MediaLibraryItem | null) => void;
  upload: (file: File) => Promise<void>;
  triggerUploadPicker: () => void;
  registerFileInput: (node: HTMLInputElement | null) => void;
}

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null);

/**
 * Shared state for every Media Library pane, regardless of whether it renders inside a
 * Panel split, a detached canvas Window, or a Studio preset. Mount once per Feature
 * instance (the app currently mounts a single global instance) so panes stay in sync.
 */
export function MediaLibraryProvider({
  children,
  defaultAgentId,
}: {
  children: React.ReactNode;
  defaultAgentId?: string;
}) {
  const [filters, setFilters] = useState<MediaLibraryFilters>(() => ({
    ...DEFAULT_MEDIA_FILTERS,
    agentId: defaultAgentId ?? '',
  }));
  const [facets, setFacets] = useState<MediaFacets | null>(null);
  const [agentIds, setAgentIds] = useState<string[]>(['default']);
  const [selected, setSelected] = useState<MediaLibraryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadAgentId = filters.agentId || defaultAgentId || 'default';
  const { items, loading, error, hasMore, loadMore, refresh } = useMediaLibraryInfiniteQuery(filters);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  useEffect(() => {
    void (async () => {
      try {
        const f = await fetchJson<MediaFacets>('/api/media/facets');
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

  const upload = useCallback(
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

  const registerFileInput = useCallback((node: HTMLInputElement | null) => {
    fileInputRef.current = node;
  }, []);

  const triggerUploadPicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const value = useMemo<MediaLibraryContextValue>(
    () => ({
      filters,
      setFilters,
      facets,
      agentIds,
      items,
      loading,
      error,
      hasMore,
      loadMore,
      refresh,
      selected,
      select: setSelected,
      upload,
      triggerUploadPicker,
      registerFileInput,
    }),
    [
      filters,
      facets,
      agentIds,
      items,
      loading,
      error,
      hasMore,
      loadMore,
      refresh,
      selected,
      upload,
      triggerUploadPicker,
      registerFileInput,
    ],
  );

  return (
    <MediaLibraryContext.Provider value={value}>
      <input
        ref={registerFileInput}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = '';
        }}
      />
      {children}
    </MediaLibraryContext.Provider>
  );
}

export function useMediaLibrary(): MediaLibraryContextValue {
  const value = useContext(MediaLibraryContext);
  if (!value) throw new Error('useMediaLibrary must be used within MediaLibraryProvider');
  return value;
}
