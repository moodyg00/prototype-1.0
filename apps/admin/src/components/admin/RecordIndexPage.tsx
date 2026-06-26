'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { Filter, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { cn } from '@/src/lib/utils';
import { getAdminCreateHref, isAdminDbSection } from '@/src/lib/admin-record-form-config';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info' | 'error' | 'destructive';

export type RecordMeta = {
  label: string;
  value: string;
};

export type RecordItem = {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  metric?: string;
  accent?: string;
  badge?: {
    label: string;
    variant?: BadgeVariant;
  };
  tags?: string[];
  meta: RecordMeta[];
};

export type RecordIndexConfig = {
  eyebrow: string;
  title: string;
  description: string;
  hideToolbar?: boolean;
  searchPlaceholder: string;
  filterLabel: string;
  emptyMessage: string;
  filterOptions: Array<{
    value: string;
    label: string;
  }>;
  gridClassName: string;
  records: RecordItem[];
};

function matchSearch(record: RecordItem, query: string) {
  const haystack = [
    record.name,
    record.subtitle,
    record.category,
    record.metric,
    record.badge?.label,
    ...(record.tags ?? []),
    ...record.meta.flatMap((item) => [item.label, item.value]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

export function RecordIndexPage({
  config,
  renderRecords,
}: {
  config: RecordIndexConfig;
  renderRecords?: (records: RecordItem[]) => React.ReactNode;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [dbRecords, setDbRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const section = pathname.split('/').filter(Boolean)[1] ?? '';
  const createHref = getAdminCreateHref(section);
  const useDbRecords = isAdminDbSection(section);

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      if (!useDbRecords) {
        setDbRecords([]);
        setLoadError(null);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch(`/api/admin/${section}`, { cache: 'no-store' });
        const body = (await response.json()) as { records?: RecordItem[]; error?: string };

        if (!response.ok) {
          throw new Error(body.error ?? 'Unable to load records.');
        }

        if (active) {
          setDbRecords(Array.isArray(body.records) ? body.records : []);
        }
      } catch (error) {
        if (active) {
          setDbRecords([]);
          setLoadError(error instanceof Error ? error.message : 'Unable to load records.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      active = false;
    };
  }, [section, useDbRecords]);

  const sourceRecords = useDbRecords ? dbRecords : config.records;

  const filtered = useMemo(() => {
    return sourceRecords.filter((record) => {
      const matchesFilter = filter === 'all' || record.category === filter;
      const matchesQuery = query.trim().length === 0 || matchSearch(record, query);
      return matchesFilter && matchesQuery;
    });
  }, [sourceRecords, filter, query]);

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--border) 72%, #111111 28%)',
              background: 'color-mix(in srgb, var(--card) 84%, #f3efe7 16%)',
              color: 'var(--muted-foreground)',
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {config.eyebrow}
          </div>
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            {config.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            {filtered.length} visible
          </span>
          {createHref && config.hideToolbar ? (
            <Link
              aria-label="Add record"
              href={createHref}
              className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }), 'rounded-full text-lg font-semibold')}
            >
              +
            </Link>
          ) : null}
        </div>
      </header>

      <div className="space-y-5">
          {!config.hideToolbar ? (
            <div className="grid gap-3 lg:grid-cols-[1fr_240px_auto]">
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                  Search
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={config.searchPlaceholder}
                    className="pl-10"
                    type="search"
                  />
                </div>
              </label>
              <label className="space-y-2">
                <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                  {config.filterLabel}
                </span>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    className="h-9 w-full rounded-md border pl-10 pr-3 text-sm outline-none sm:h-8"
                    style={{
                      borderColor: 'var(--border)',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                    }}
                  >
                    {config.filterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              {createHref ? (
                <div className="flex items-end">
                  <Link
                    aria-label="Add record"
                    href={createHref}
                    className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }), 'rounded-full text-lg font-semibold')}
                  >
                    +
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {loading ? (
            <div
              className="border px-5 py-10 text-center text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              Loading records...
            </div>
          ) : loadError ? (
            <div
              className="border px-5 py-10 text-center text-sm"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              {loadError}
            </div>
          ) : filtered.length === 0 ? (
            <Empty
              className="rounded-xl border py-14"
              style={{ borderColor: 'var(--border)' }}
            >
              <EmptyHeader>
                <EmptyTitle>No Records</EmptyTitle>
                <EmptyDescription>
                  {useDbRecords ? 'No records are available yet.' : config.emptyMessage}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : renderRecords ? (
            renderRecords(filtered)
          ) : (
            <div className={config.gridClassName}>
              {filtered.map((record) => {
                const accent = record.accent ?? '#111111';
                const detailHref = `${pathname.replace(/\/$/, '')}/${record.id}`;

                return (
                  <Link
                    key={record.id}
                    href={detailHref}
                    className="group block rounded-xl border p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                    style={{
                      borderColor: `color-mix(in srgb, var(--border) 84%, ${accent} 16%)`,
                      background: 'var(--card)',
                      boxShadow: '0 10px 24px rgba(17, 17, 17, 0.04)',
                    }}
                  >
                    <article>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-[15px] font-semibold leading-tight">{record.name}</div>
                          <div className="text-sm leading-6" style={{ color: 'var(--muted-foreground)' }}>{record.subtitle}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ background: accent }} />
                          {record.badge ? (
                            <Badge variant={record.badge.variant ?? 'outline'}>{record.badge.label}</Badge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {record.meta.map((item) => (
                          <div key={`${record.id}-${item.label}`} className="rounded-lg border px-3 py-2" style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent 20%)', background: 'color-mix(in srgb, var(--card) 96%, #f3efe7 4%)' }}>
                            <div className="text-[10px] font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
                              {item.label}
                            </div>
                            <div className="mt-1 text-sm font-medium leading-6">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                          {(record.tags ?? []).map((tag) => (
                            <span key={`${record.id}-${tag}`} className="rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.14em]" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                        {record.metric ? (
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                              Snapshot
                            </div>
                            <div className="text-sm font-semibold leading-6">{record.metric}</div>
                          </div>
                        ) : (
                          <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
                            Open record
                          </div>
                        )}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
}
