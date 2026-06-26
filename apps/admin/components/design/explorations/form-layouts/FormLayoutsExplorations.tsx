'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { FormLayoutSingleColumn } from '@/components/design/explorations/form-layouts/Variation01';
import { FormLayoutTwoColumn } from '@/components/design/explorations/form-layouts/Variation02';
import { FormLayoutFieldsetSections } from '@/components/design/explorations/form-layouts/Variation03';
import { FormLayoutInlineRow } from '@/components/design/explorations/form-layouts/Variation04';
import { FormLayoutCompactCard } from '@/components/design/explorations/form-layouts/Variation05';
import { FormLayoutWizard } from '@/components/design/explorations/form-layouts/Variation06';
import { FormLayoutModalShape } from '@/components/design/explorations/form-layouts/Variation07';
import { FormLayoutSplitPreview } from '@/components/design/explorations/form-layouts/Variation08';
import { FormLayoutProgressive } from '@/components/design/explorations/form-layouts/Variation09';
import { FormLayoutReviewSummary } from '@/components/design/explorations/form-layouts/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'form-layout-single-column': FormLayoutSingleColumn,
  'form-layout-two-column': FormLayoutTwoColumn,
  'form-layout-fieldset-sections': FormLayoutFieldsetSections,
  'form-layout-inline-row': FormLayoutInlineRow,
  'form-layout-compact-card': FormLayoutCompactCard,
  'form-layout-wizard': FormLayoutWizard,
  'form-layout-modal-shape': FormLayoutModalShape,
  'form-layout-split-preview': FormLayoutSplitPreview,
  'form-layout-progressive': FormLayoutProgressive,
  'form-layout-review-summary': FormLayoutReviewSummary,
};

export function FormLayoutsExplorations() {
  const variants = getVariantsByCategory('form-layouts');
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
