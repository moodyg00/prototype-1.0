import Link from 'next/link';
import {
  Layout,
  PanelLeft,
  MousePointerClick,
  TextCursorInput,
  ChevronsUpDown,
  Table as TableIcon,
  LayoutGrid,
  SquareStack,
  Bell,
  Folders,
  Inbox,
  Loader,
  ListChecks,
  Heading1,
  ArrowUpRight,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CATEGORIES,
  VARIANTS,
  countFavoritesInCategory,
  getFavoriteEntries,
  type CategoryId,
} from '@/src/design/manifest';

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  header: Layout,
  sidebar: PanelLeft,
  buttons: MousePointerClick,
  inputs: TextCursorInput,
  selects: ChevronsUpDown,
  tables: TableIcon,
  cards: LayoutGrid,
  dialogs: SquareStack,
  toasts: Bell,
  tabs: Folders,
  'empty-states': Inbox,
  loading: Loader,
  'form-layouts': ListChecks,
  'page-header': Heading1,
};

const CATEGORY_LABEL: Record<CategoryId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;

export default function DesignReferencePage() {
  const favorites = getFavoriteEntries();

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl space-y-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border) 78%)',
              color: 'var(--muted-foreground)',
              background: 'color-mix(in srgb, var(--card) 86%, var(--primary-soft) 14%)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Design Library
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Component repository for the business suite
          </h1>
          <p
            className="max-w-2xl text-sm sm:text-base"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {VARIANTS.length} ready-to-copy variations across {CATEGORIES.length} categories.
            Browse a category to preview every variation, then pull one into product code with the{' '}
            <code
              className="rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs"
              style={{ color: 'var(--foreground)' }}
            >
              /add-component
            </code>{' '}
            skill. Favorites bubble to the top.
          </p>
        </div>
      </section>

      <section
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border px-5 py-4"
        style={{
          background: 'color-mix(in srgb, var(--card) 90%, var(--background) 10%)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="text-xs uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          How this works
        </div>
        <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Browse a category &rarr; click &ldquo;Copy install command&rdquo; on a variation &rarr;
          paste{' '}
          <code className="rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs">
            /add-component &lt;slug&gt; &lt;target-path&gt;
          </code>{' '}
          into chat. The agent strips the mock blocks and writes a prop-driven component into your
          target file.
        </div>
      </section>

      {favorites.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Star
                  className="size-4"
                  style={{ color: 'var(--primary)', fill: 'var(--primary)' }}
                />
                <h2 className="font-semibold text-xl tracking-tight">Favorites</h2>
                <Badge variant="info" size="sm">
                  {favorites.length} pinned
                </Badge>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Curated production-strong variations. Edit{' '}
                <code className="rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs">
                  FAVORITES
                </code>{' '}
                in{' '}
                <code className="rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs">
                  src/design/manifest.ts
                </code>{' '}
                to change this list.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((variant) => (
              <Link
                key={variant.slug}
                href={`/admin/design/explorations/${variant.category}#${variant.slug}`}
                className="group relative flex flex-col gap-3 rounded-2xl border p-4 transition-all hover:shadow-md"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    {CATEGORY_LABEL[variant.category]}
                  </Badge>
                  <Star
                    className="size-3.5"
                    style={{ color: 'var(--primary)', fill: 'var(--primary)' }}
                  />
                </div>

                <div className="space-y-1">
                  <div className="font-semibold tracking-tight">{variant.displayName}</div>
                  <code
                    className="block font-mono text-[11px]"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {variant.slug}
                  </code>
                </div>

                <p
                  className="line-clamp-2 text-xs leading-relaxed"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {variant.intent}
                </p>

                <div className="mt-auto flex items-center justify-end pt-1">
                  <ArrowUpRight
                    className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="font-semibold text-xl tracking-tight">All categories</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Every category ships with 10 variations. Open one to compare side-by-side.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const variantCount = VARIANTS.filter((v) => v.category === cat.id).length;
            const favoriteCount = countFavoritesInCategory(cat.id);
            return (
              <Link
                key={cat.id}
                href={`/admin/design/explorations/${cat.id}`}
                className="group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all hover:shadow-md"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="grid size-9 place-items-center rounded-lg"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <ArrowUpRight
                    className="size-4 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="font-semibold tracking-tight">{cat.label}</div>
                  <div
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {cat.description}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="info" size="sm" className="gap-1.5">
                      <span className="size-1.5 rounded-full bg-current" />
                      {variantCount} variants
                    </Badge>
                    {favoriteCount > 0 && (
                      <Badge variant="outline" size="sm" className="gap-1">
                        <Star
                          className="size-3"
                          style={{ color: 'var(--primary)', fill: 'var(--primary)' }}
                        />
                        {favoriteCount}
                      </Badge>
                    )}
                  </div>
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {cat.id}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        className="rounded-2xl border p-5 text-sm"
        style={{
          background: 'var(--muted)',
          borderColor: 'var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        <div className="mb-1 text-xs uppercase tracking-[0.18em]">For agents reading this page</div>
        This page is the index for the design library. Slugs are the stable contract — see{' '}
        <code className="rounded bg-[var(--background)] px-1 py-0.5 font-mono text-xs">
          src/design/manifest.ts
        </code>{' '}
        for the full registry. To install a variation into product code, use the{' '}
        <code className="rounded bg-[var(--background)] px-1 py-0.5 font-mono text-xs">
          add-component
        </code>{' '}
        skill with{' '}
        <code className="rounded bg-[var(--background)] px-1 py-0.5 font-mono text-xs">
          /add-component &lt;slug&gt; &lt;target-path&gt;
        </code>
        .
      </section>
    </div>
  );
}
