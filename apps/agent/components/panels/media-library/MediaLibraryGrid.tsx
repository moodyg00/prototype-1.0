'use client';

import { useEffect, useRef } from 'react';

import type { MediaLibraryItem } from './types';

export function MediaLibraryGrid({
  items,
  loading,
  hasMore,
  onLoadMore,
  onSelect,
  selectedId,
  columnMinWidth,
}: {
  items: MediaLibraryItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (item: MediaLibraryItem) => void;
  selectedId?: string | null;
  columnMinWidth: number;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: '120px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onLoadMore, hasMore]);

  return (
    <div className="min-h-0 flex-1 overflow-auto p-3">
      <div
        className="gap-2"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${columnMinWidth}px, 1fr))`,
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className={`group relative aspect-square overflow-hidden rounded-lg border text-left ${
              selectedId === item.id
                ? 'border-violet-400/80 ring-1 ring-violet-400/40'
                : 'border-white/10 hover:border-white/25'
            }`}
          >
            {item.mediaKind === 'video' || item.mimeType.startsWith('video/') ? (
              <video
                src={item.url}
                className="h-full w-full object-cover"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.thumbnailUrl ?? item.url}
                alt={item.altText ?? item.filename}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-zinc-300 opacity-0 transition group-hover:opacity-100">
              {item.tags?.origin ?? item.libraryType}
            </div>
          </button>
        ))}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="aspect-square animate-pulse rounded-lg border border-white/5 bg-white/5"
            />
          ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="h-8 w-full" aria-hidden />}
      {!loading && items.length === 0 && (
        <p className="py-8 text-center text-[11px] text-zinc-500">No media yet — upload or generate from Photography.</p>
      )}
    </div>
  );
}