'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { EmptyStateClassic } from '@/components/design/explorations/empty-states/Variation01';
import { EmptyStateSearchNoResults } from '@/components/design/explorations/empty-states/Variation05';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'empty-state-classic': EmptyStateClassic,
  'empty-state-search-no-results': EmptyStateSearchNoResults,
};

export function EmptyStatesExplorations() {
  const variants = getVariantsByCategory('empty-states');
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
