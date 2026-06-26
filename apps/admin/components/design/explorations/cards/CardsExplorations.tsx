'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { CardBasicSurface } from '@/components/design/explorations/cards/Variation01';
import { CardBorderedFooterActions } from '@/components/design/explorations/cards/Variation02';
import { CardStatSparkline } from '@/components/design/explorations/cards/Variation03';
import { CardMediaLed } from '@/components/design/explorations/cards/Variation04';
import { CardList } from '@/components/design/explorations/cards/Variation05';
import { CardAvatarRecord } from '@/components/design/explorations/cards/Variation06';
import { CardFramedActionMenu } from '@/components/design/explorations/cards/Variation07';
import { CardMetricComparison } from '@/components/design/explorations/cards/Variation08';
import { CardCalloutAlert } from '@/components/design/explorations/cards/Variation09';
import { CardGhostAddNew } from '@/components/design/explorations/cards/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'card-basic-surface': CardBasicSurface,
  'card-bordered-footer-actions': CardBorderedFooterActions,
  'card-stat-sparkline': CardStatSparkline,
  'card-media-led': CardMediaLed,
  'card-list': CardList,
  'card-avatar-record': CardAvatarRecord,
  'card-framed-action-menu': CardFramedActionMenu,
  'card-metric-comparison': CardMetricComparison,
  'card-callout-alert': CardCalloutAlert,
  'card-ghost-add-new': CardGhostAddNew,
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
