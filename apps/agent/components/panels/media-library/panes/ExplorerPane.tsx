'use client';

import { Folder, Image as ImageIcon, Layers, Tag } from 'lucide-react';
import { useMemo } from 'react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { useMediaLibrary } from '../MediaLibraryProvider';

/**
 * Stub file-explorer: a flat list of library-type "folders" derived from facets.
 * Selecting a folder narrows the shared filter state so every other Media Library
 * pane (grid, detail, filters) reacts immediately. Refine into a real tree later.
 */
export function ExplorerPane({ context }: { context: PaneRenderContext }) {
  const { filters, setFilters, facets, items } = useMediaLibrary();

  const folders = useMemo(() => {
    const types = facets?.libraryTypes ?? ['content', 'submitted', 'admin_record'];
    return types.map((type) => ({
      id: type,
      label: type,
      count: items.filter((item) => item.libraryType === type).length,
    }));
  }, [facets, items]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950" data-pane-instance={context.instanceId}>
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] font-medium text-zinc-200">
        <Layers size={12} className="text-zinc-500" />
        Explorer
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <button
          type="button"
          onClick={() => setFilters({ ...filters, libraryType: '' })}
          className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] ${
            filters.libraryType === '' ? 'bg-violet-500/15 text-violet-200' : 'text-zinc-300 hover:bg-white/5'
          }`}
        >
          <ImageIcon size={12} className="shrink-0" />
          All media
        </button>
        {folders.map((folder) => (
          <button
            key={folder.id}
            type="button"
            onClick={() => setFilters({ ...filters, libraryType: folder.id })}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] ${
              filters.libraryType === folder.id
                ? 'bg-violet-500/15 text-violet-200'
                : 'text-zinc-300 hover:bg-white/5'
            }`}
          >
            <Folder size={12} className="shrink-0 text-zinc-500" />
            <span className="min-w-0 flex-1 truncate">{folder.label}</span>
            <span className="text-[10px] text-zinc-600">{folder.count}</span>
          </button>
        ))}
        {facets?.categories?.length ? (
          <>
            <div className="mt-3 mb-1 px-2 text-[10px] uppercase tracking-wider text-zinc-600">Categories</div>
            {facets.categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFilters({ ...filters, categoryId: category.id })}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[11px] ${
                  filters.categoryId === category.id
                    ? 'bg-violet-500/15 text-violet-200'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Tag size={12} className="shrink-0 text-zinc-500" />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
              </button>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
