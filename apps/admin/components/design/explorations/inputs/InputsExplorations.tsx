'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { InputClassicOutline } from '@/components/design/explorations/inputs/Variation01';
import { InputFilledSoftTint } from '@/components/design/explorations/inputs/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'input-classic-outline': InputClassicOutline,
  'input-filled-soft-tint': InputFilledSoftTint,
};

export function InputsExplorations() {
  const variants = getVariantsByCategory('inputs');
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
