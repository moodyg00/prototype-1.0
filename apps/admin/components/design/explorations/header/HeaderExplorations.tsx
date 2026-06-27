'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { HeaderClassicShell } from '@/components/design/explorations/header/Variation01';
import { HeaderCommandBar } from '@/components/design/explorations/header/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'header-classic-shell': HeaderClassicShell,
  'header-command-bar': HeaderCommandBar,
};

export function HeaderExplorations() {
  const variants = getVariantsByCategory('header');
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
