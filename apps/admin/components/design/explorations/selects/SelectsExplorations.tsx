'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { SelectClassicSingle } from '@/components/design/explorations/selects/Variation01';
import { SelectAutocomplete } from '@/components/design/explorations/selects/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'select-classic-single': SelectClassicSingle,
  'select-autocomplete': SelectAutocomplete,
};

export function SelectsExplorations() {
  const variants = getVariantsByCategory('selects');
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
