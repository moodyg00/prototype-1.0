'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { CardBasicSurface } from '@/components/design/explorations/cards/Variation01';
import { CardStatSparkline } from '@/components/design/explorations/cards/Variation03';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'card-basic-surface': CardBasicSurface,
  'card-stat-sparkline': CardStatSparkline,
};

export function CardsExplorations() {
  const variants = getVariantsByCategory('cards');
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
