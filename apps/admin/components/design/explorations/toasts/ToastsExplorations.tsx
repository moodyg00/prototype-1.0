'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { ToastStackedCorner } from '@/components/design/explorations/toasts/Variation01';
import { ToastBanner } from '@/components/design/explorations/toasts/Variation02';
import { ToastSemanticSoft } from '@/components/design/explorations/toasts/Variation03';
import { ToastBorderedAction } from '@/components/design/explorations/toasts/Variation04';
import { ToastPill } from '@/components/design/explorations/toasts/Variation05';
import { ToastProgressUndo } from '@/components/design/explorations/toasts/Variation06';
import { ToastLongForm } from '@/components/design/explorations/toasts/Variation07';
import { ToastDestructiveInline } from '@/components/design/explorations/toasts/Variation08';
import { ToastPromise } from '@/components/design/explorations/toasts/Variation09';
import { ToastAgentFinished } from '@/components/design/explorations/toasts/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'toast-stacked-corner': ToastStackedCorner,
  'toast-banner': ToastBanner,
  'toast-semantic-soft': ToastSemanticSoft,
  'toast-bordered-action': ToastBorderedAction,
  'toast-pill': ToastPill,
  'toast-progress-undo': ToastProgressUndo,
  'toast-long-form': ToastLongForm,
  'toast-destructive-inline': ToastDestructiveInline,
  'toast-promise': ToastPromise,
  'toast-agent-finished': ToastAgentFinished,
};

export function ToastsExplorations() {
  const variants = getVariantsByCategory('toasts');
  return (
    <div className="space-y-12">
      {variants.map((v) => {
        const Component = COMPONENT_BY_SLUG[v.slug];
        if (!Component) return null;
        const isFavorite = (FAVORITES as readonly string[]).includes(v.slug);
        return (
          <VariationFrame
            key={v.slug}
            slug={v.slug}
            category={v.category}
            number={v.number}
            displayName={v.displayName}
            intent={v.intent}
            isFavorite={isFavorite}
          >
            <Component />
          </VariationFrame>
        );
      })}
    </div>
  );
}
