'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { InputClassicOutline } from '@/components/design/explorations/inputs/Variation01';
import { InputFilledSoftTint } from '@/components/design/explorations/inputs/Variation02';
import { InputUnderlineMinimal } from '@/components/design/explorations/inputs/Variation03';
import { InputLeadingIcon } from '@/components/design/explorations/inputs/Variation04';
import { InputTrailingKbd } from '@/components/design/explorations/inputs/Variation05';
import { InputPasswordStrength } from '@/components/design/explorations/inputs/Variation06';
import { InputSearchClear } from '@/components/design/explorations/inputs/Variation07';
import { InputPrefixSuffix } from '@/components/design/explorations/inputs/Variation08';
import { InputValidationStates } from '@/components/design/explorations/inputs/Variation09';
import { InputSizesMatrix } from '@/components/design/explorations/inputs/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'input-classic-outline': InputClassicOutline,
  'input-filled-soft-tint': InputFilledSoftTint,
  'input-underline-minimal': InputUnderlineMinimal,
  'input-leading-icon': InputLeadingIcon,
  'input-trailing-kbd': InputTrailingKbd,
  'input-password-strength': InputPasswordStrength,
  'input-search-clear': InputSearchClear,
  'input-prefix-suffix': InputPrefixSuffix,
  'input-validation-states': InputValidationStates,
  'input-sizes-matrix': InputSizesMatrix,
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
