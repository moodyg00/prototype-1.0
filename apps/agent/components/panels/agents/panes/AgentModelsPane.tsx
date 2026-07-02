'use client';

import { useEffect, useMemo, useState } from 'react';

import type { PaneRenderContext } from '@/lib/pane-types';
import { fetchJson } from '@/lib/memory/fetch-json';
import type { ModelCatalogRow } from '@/app/api/models/route';

import { AgentsPaneShell } from '../agents-pane-utils';

type CategoryFilter = 'all' | 'text' | 'image' | 'video';

function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return '—';
  if (value === 0) return 'Free';
  return `$${value.toFixed(2)}`;
}

function formatTokens(value: number | null): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function Badge({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'green' | 'blue' | 'purple' | 'amber' }) {
  const colorClasses = {
    default: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    green: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60',
    blue: 'bg-sky-950/40 text-sky-400 border-sky-800/60',
    purple: 'bg-violet-950/40 text-violet-400 border-violet-800/60',
    amber: 'bg-amber-950/40 text-amber-400 border-amber-800/60',
  };
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] ${colorClasses[color]}`}>
      {children}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const color: Record<string, 'default' | 'green' | 'blue' | 'purple' | 'amber'> = {
    xai: 'default',
    anthropic: 'amber',
    openai: 'green',
    openrouter: 'purple',
    stability: 'blue',
    runway: 'blue',
    luma: 'blue',
  };
  return <Badge color={color[provider] ?? 'default'}>{provider}</Badge>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AgentModelsPane({ context: _context }: { context: PaneRenderContext }) {
  const [models, setModels] = useState<ModelCatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchJson<{ models: ModelCatalogRow[] }>('/api/models')
      .then((data) => {
        if (cancelled) return;
        setModels(data.models ?? []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Load failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return models.filter((m) => {
      const matchesCategory = filter === 'all' || m.category === filter;
      const matchesSearch =
        !term ||
        m.label.toLowerCase().includes(term) ||
        m.provider.toLowerCase().includes(term) ||
        m.catalogId.toLowerCase().includes(term) ||
        (m.description ?? '').toLowerCase().includes(term) ||
        m.specializations.some((s) => s.toLowerCase().includes(term));
      return matchesCategory && matchesSearch;
    });
  }, [models, filter, search]);

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'text', label: 'Text' },
    { key: 'image', label: 'Image' },
    { key: 'video', label: 'Video' },
  ];

  return (
    <AgentsPaneShell title="Model catalog">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                filter === c.key
                  ? 'bg-zinc-200 text-zinc-900'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {c.label}
            </button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="ml-auto min-w-[140px] rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>

        {loading ? (
          <p className="text-[11px] text-zinc-500">Loading models...</p>
        ) : error ? (
          <p className="text-[11px] text-red-400">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-[11px] text-zinc-500">No models match.</p>
        ) : (
          <div className="flex min-h-0 flex-col gap-2 overflow-auto">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="rounded border border-zinc-800 bg-zinc-900/40 p-2.5 text-[11px]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-zinc-100">{m.label}</span>
                      <ProviderBadge provider={m.provider} />
                      <Badge color="default">{m.category}</Badge>
                      {!m.isActive && <Badge color="default">inactive</Badge>}
                    </div>
                    <span className="text-zinc-500">{m.catalogId}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 text-[10px] text-zinc-400">
                    {m.contextWindowTokens != null && (
                      <span>context: {formatTokens(m.contextWindowTokens)}</span>
                    )}
                    {m.pricePerMInputTokens != null && (
                      <span>
                        $/1M tokens: {formatPrice(m.pricePerMInputTokens)} in /{' '}
                        {formatPrice(m.pricePerMOutputTokens)} out
                      </span>
                    )}
                  </div>
                </div>

                {m.description ? (
                  <p className="mt-1.5 text-zinc-400">{m.description}</p>
                ) : null}

                <div className="mt-2 flex flex-wrap gap-1">
                  {m.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded bg-zinc-800/60 px-1.5 py-0.5 text-[10px] text-zinc-400"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="mt-1.5 flex flex-wrap gap-1">
                  {m.capabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {m.lastUpdatedAt && (
                  <div className="mt-1.5 text-[10px] text-zinc-600">
                    Last updated: {new Date(m.lastUpdatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AgentsPaneShell>
  );
}
