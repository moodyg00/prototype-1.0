'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Copy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VariationFrameProps {
  slug: string;
  category: string;
  number: number;
  displayName: string;
  intent: string;
  isFavorite: boolean;
  /** Optional descriptor under the preview chrome, e.g. for the trailing label. */
  previewLabel?: string;
  children: React.ReactNode;
  /** Optional content to render below the preview frame (e.g. fake page body). */
  afterPreview?: React.ReactNode;
}

export function VariationFrame({
  slug,
  category,
  number,
  displayName,
  intent,
  isFavorite,
  previewLabel,
  children,
  afterPreview,
}: VariationFrameProps) {
  const numberLabel = String(number).padStart(2, '0');
  const label = previewLabel ?? `preview · ${category} / variation-${numberLabel}`;

  const handleCopySlug = async () => {
    try {
      await navigator.clipboard.writeText(slug);
      toast.success(`Copied slug ${slug}`);
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const handleCopyInstall = async () => {
    const command = `/add-component ${slug} <target-path>`;
    try {
      await navigator.clipboard.writeText(command);
      toast.success('Copied install command', {
        description: 'Paste into chat with a target path.',
      });
    } catch {
      toast.error('Clipboard unavailable');
    }
  };

  const handleToggleFavorite = () => {
    if (isFavorite) {
      toast(`'${slug}' is already a favorite`, {
        description: `Remove it from FAVORITES in src/design/manifest.ts to unpin.`,
      });
    } else {
      toast(`Add '${slug}' to FAVORITES in src/design/manifest.ts to pin it`, {
        description: 'Favorites are curated in the manifest so they survive across sessions.',
      });
    }
  };

  return (
    <section id={slug} data-slug={slug} className="space-y-3 scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="font-mono text-[11px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Variation {numberLabel}
            </div>
            <button
              type="button"
              onClick={handleCopySlug}
              className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[11px] transition-colors hover:bg-[var(--muted)]"
              style={{
                borderColor: 'var(--border)',
                background: 'color-mix(in srgb, var(--card) 90%, var(--background) 10%)',
                color: 'var(--foreground)',
              }}
              aria-label={`Copy slug ${slug}`}
              title="Click to copy slug"
            >
              {slug}
            </button>
          </div>
          <h2 className="font-semibold text-xl tracking-tight">{displayName}</h2>
          <p
            className="max-w-3xl text-sm leading-relaxed"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {intent}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyInstall}
            className="gap-1.5"
          >
            <Copy className="size-3.5" />
            Copy install command
          </Button>
          <Button
            variant={isFavorite ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label={isFavorite ? `'${slug}' is favorited` : `Favorite ${slug}`}
            aria-pressed={isFavorite}
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Pinned in manifest FAVORITES' : 'Mark as favorite'}
          >
            <Star
              className="size-3.5"
              style={{
                fill: isFavorite ? 'var(--primary)' : 'transparent',
                color: isFavorite ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            />
          </Button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        <div
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-widest"
          style={{
            background: 'color-mix(in srgb, var(--muted) 70%, var(--card) 30%)',
            borderBottom: '1px solid var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <span className="size-2 rounded-full bg-red-400" />
          <span className="size-2 rounded-full bg-yellow-400" />
          <span className="size-2 rounded-full bg-green-400" />
          <span className="ms-3 font-mono normal-case tracking-normal">{label}</span>
        </div>
        <div className="bg-[var(--background)]">
          {children}
          {afterPreview}
        </div>
      </div>
    </section>
  );
}
