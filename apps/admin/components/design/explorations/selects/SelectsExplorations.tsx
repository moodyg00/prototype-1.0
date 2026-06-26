'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { SelectClassicSingle } from '@/components/design/explorations/selects/Variation01';
import { SelectAutocomplete } from '@/components/design/explorations/selects/Variation02';
import { SelectMultiChips } from '@/components/design/explorations/selects/Variation03';
import { SelectGroupedSections } from '@/components/design/explorations/selects/Variation04';
import { SelectAsyncLoading } from '@/components/design/explorations/selects/Variation05';
import { SelectAvatarIcon } from '@/components/design/explorations/selects/Variation06';
import { SelectRichItems } from '@/components/design/explorations/selects/Variation07';
import { SelectTimezoneGrouped } from '@/components/design/explorations/selects/Variation08';
import { SelectCascadingTwoPane } from '@/components/design/explorations/selects/Variation09';
import { SelectCommandPalette } from '@/components/design/explorations/selects/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'select-classic-single': SelectClassicSingle,
  'select-autocomplete': SelectAutocomplete,
  'select-multi-chips': SelectMultiChips,
  'select-grouped-sections': SelectGroupedSections,
  'select-async-loading': SelectAsyncLoading,
  'select-avatar-icon': SelectAvatarIcon,
  'select-rich-items': SelectRichItems,
  'select-timezone-grouped': SelectTimezoneGrouped,
  'select-cascading-two-pane': SelectCascadingTwoPane,
  'select-command-palette': SelectCommandPalette,
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
