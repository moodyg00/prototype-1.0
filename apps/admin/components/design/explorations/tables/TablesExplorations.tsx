'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { TableClassicBordered } from '@/components/design/explorations/tables/Variation01';
import { TableMinimalHoverLanes } from '@/components/design/explorations/tables/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'table-classic-bordered': TableClassicBordered,
  'table-minimal-hover-lanes': TableMinimalHoverLanes,
};

export function TablesExplorations() {
  const variants = getVariantsByCategory('tables');
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
