'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { ToastStackedCorner } from '@/components/design/explorations/toasts/Variation01';
import { ToastBanner } from '@/components/design/explorations/toasts/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'toast-stacked-corner': ToastStackedCorner,
  'toast-banner': ToastBanner,
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
