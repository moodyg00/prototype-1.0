'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { TabClassicUnderline } from '@/components/design/explorations/tabs/Variation01';
import { TabPillSegmented } from '@/components/design/explorations/tabs/Variation02';
import { TabConnectedCards } from '@/components/design/explorations/tabs/Variation03';
import { TabVerticalStack } from '@/components/design/explorations/tabs/Variation04';
import { TabIconCount } from '@/components/design/explorations/tabs/Variation05';
import { TabRouteStyle } from '@/components/design/explorations/tabs/Variation06';
import { TabResponsiveDropdown } from '@/components/design/explorations/tabs/Variation07';
import { TabCardsWithDescription } from '@/components/design/explorations/tabs/Variation08';
import { TabMinimalDot } from '@/components/design/explorations/tabs/Variation09';
import { TabWithToolbar } from '@/components/design/explorations/tabs/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'tab-classic-underline': TabClassicUnderline,
  'tab-pill-segmented': TabPillSegmented,
  'tab-connected-cards': TabConnectedCards,
  'tab-vertical-stack': TabVerticalStack,
  'tab-icon-count': TabIconCount,
  'tab-route-style': TabRouteStyle,
  'tab-responsive-dropdown': TabResponsiveDropdown,
  'tab-cards-with-description': TabCardsWithDescription,
  'tab-minimal-dot': TabMinimalDot,
  'tab-with-toolbar': TabWithToolbar,
};

export function TabsExplorations() {
  const variants = getVariantsByCategory('tabs');
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
