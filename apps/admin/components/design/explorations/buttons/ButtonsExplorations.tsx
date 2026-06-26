'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { ButtonVariantMatrix } from '@/components/design/explorations/buttons/Variation01';
import { ButtonSizeRhythm } from '@/components/design/explorations/buttons/Variation02';
import { ButtonIconOnlyTooltip } from '@/components/design/explorations/buttons/Variation03';
import { ButtonLoadingDisabled } from '@/components/design/explorations/buttons/Variation04';
import { ButtonSplit } from '@/components/design/explorations/buttons/Variation05';
import { ButtonSegmented } from '@/components/design/explorations/buttons/Variation06';
import { ButtonFab } from '@/components/design/explorations/buttons/Variation07';
import { ButtonBadgeShortcut } from '@/components/design/explorations/buttons/Variation08';
import { ButtonPill } from '@/components/design/explorations/buttons/Variation09';
import { ButtonToggleStateful } from '@/components/design/explorations/buttons/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'button-variant-matrix': ButtonVariantMatrix,
  'button-size-rhythm': ButtonSizeRhythm,
  'button-icon-only-tooltip': ButtonIconOnlyTooltip,
  'button-loading-disabled': ButtonLoadingDisabled,
  'button-split': ButtonSplit,
  'button-segmented': ButtonSegmented,
  'button-fab': ButtonFab,
  'button-badge-shortcut': ButtonBadgeShortcut,
  'button-pill': ButtonPill,
  'button-toggle-stateful': ButtonToggleStateful,
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
