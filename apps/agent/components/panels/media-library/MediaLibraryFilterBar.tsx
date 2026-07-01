'use client';

import { Upload } from 'lucide-react';

import type { MediaLibraryFilters } from './types';

type Facets = {
  libraryTypes: string[];
  origins: readonly string[];
  mediaKinds?: readonly string[];
  categories: Array<{ id: string; name: string; slug: string }>;
};

export function MediaLibraryFilterBar({
  filters,
  facets,
  agentIds,
  onChange,
  onUpload,
  compact,
}: {
  filters: MediaLibraryFilters;
  facets: Facets | null;
  agentIds: string[];
  onChange: (next: MediaLibraryFilters) => void;
  onUpload: () => void;
  compact?: boolean;
}) {
  const selectClass =
    'rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-violet-500/50';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'p-2' : 'p-3'} border-b border-white/10`}>
      <select
        className={selectClass}
        value={filters.libraryType}
        onChange={(e) => onChange({ ...filters, libraryType: e.target.value })}
        aria-label="Library type"
      >
        <option value="">All types</option>
        {(facets?.libraryTypes ?? ['content', 'submitted', 'admin_record']).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={filters.mediaKind}
        onChange={(e) => onChange({ ...filters, mediaKind: e.target.value })}
        aria-label="Media kind"
      >
        <option value="">All media</option>
        {(facets?.mediaKinds ?? ['image', 'video', 'gif', 'file']).map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={filters.categoryId}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
        aria-label="Category"
      >
        <option value="">All categories</option>
        {(facets?.categories ?? []).map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={filters.tag}
        onChange={(e) => onChange({ ...filters, tag: e.target.value })}
        aria-label="Tag or origin"
      >
        <option value="">All tags</option>
        {(facets?.origins ?? ['upload', 'generation', 'edit']).map((o) => (
          <option key={o} value={o}>
            origin:{o}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={filters.agentId}
        onChange={(e) => onChange({ ...filters, agentId: e.target.value })}
        aria-label="Agent"
      >
        <option value="">All agents</option>
        {agentIds.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onUpload}
        className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-violet-600/90 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-violet-500"
      >
        <Upload size={12} />
        Upload
      </button>
    </div>
  );
}