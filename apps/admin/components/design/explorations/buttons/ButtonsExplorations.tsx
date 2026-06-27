'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { ButtonVariantMatrix } from '@/components/design/explorations/buttons/Variation01';
import { ButtonSizeRhythm } from '@/components/design/explorations/buttons/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'button-variant-matrix': ButtonVariantMatrix,
  'button-size-rhythm': ButtonSizeRhythm,
};

export function ButtonsExplorations() {
  const variants = getVariantsByCategory('buttons');
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
