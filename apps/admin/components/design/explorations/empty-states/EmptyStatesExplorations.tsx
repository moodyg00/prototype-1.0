'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { EmptyStateClassic } from '@/components/design/explorations/empty-states/Variation01';
import { EmptyStateIllustrationLed } from '@/components/design/explorations/empty-states/Variation02';
import { EmptyStateTipHowTo } from '@/components/design/explorations/empty-states/Variation03';
import { EmptyStateTableRow } from '@/components/design/explorations/empty-states/Variation04';
import { EmptyStateSearchNoResults } from '@/components/design/explorations/empty-states/Variation05';
import { EmptyStatePermissionLocked } from '@/components/design/explorations/empty-states/Variation06';
import { EmptyStateLoadingFinished } from '@/components/design/explorations/empty-states/Variation07';
import { EmptyStateGettingStarted } from '@/components/design/explorations/empty-states/Variation08';
import { EmptyStateError } from '@/components/design/explorations/empty-states/Variation09';
import { EmptyStateAgentPrompt } from '@/components/design/explorations/empty-states/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'empty-state-classic': EmptyStateClassic,
  'empty-state-illustration-led': EmptyStateIllustrationLed,
  'empty-state-tip-how-to': EmptyStateTipHowTo,
  'empty-state-table-row': EmptyStateTableRow,
  'empty-state-search-no-results': EmptyStateSearchNoResults,
  'empty-state-permission-locked': EmptyStatePermissionLocked,
  'empty-state-loading-finished': EmptyStateLoadingFinished,
  'empty-state-getting-started': EmptyStateGettingStarted,
  'empty-state-error': EmptyStateError,
  'empty-state-agent-prompt': EmptyStateAgentPrompt,
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
