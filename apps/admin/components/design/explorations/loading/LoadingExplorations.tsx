'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { LoadingSpinnerOnly } from '@/components/design/explorations/loading/Variation01';
import { LoadingFullPageSkeleton } from '@/components/design/explorations/loading/Variation03';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'loading-spinner-only': LoadingSpinnerOnly,
  'loading-full-page-skeleton': LoadingFullPageSkeleton,
};

export function LoadingExplorations() {
  const variants = getVariantsByCategory('loading');
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
