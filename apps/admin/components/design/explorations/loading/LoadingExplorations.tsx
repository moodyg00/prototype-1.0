'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { LoadingSpinnerOnly } from '@/components/design/explorations/loading/Variation01';
import { LoadingInlineLabel } from '@/components/design/explorations/loading/Variation02';
import { LoadingFullPageSkeleton } from '@/components/design/explorations/loading/Variation03';
import { LoadingListSkeleton } from '@/components/design/explorations/loading/Variation04';
import { LoadingCardGridSkeleton } from '@/components/design/explorations/loading/Variation05';
import { LoadingProgressBar } from '@/components/design/explorations/loading/Variation06';
import { LoadingIndeterminateShimmer } from '@/components/design/explorations/loading/Variation07';
import { LoadingButtonMatrix } from '@/components/design/explorations/loading/Variation08';
import { LoadingSkeletonShimmer } from '@/components/design/explorations/loading/Variation09';
import { LoadingLongTask } from '@/components/design/explorations/loading/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'loading-spinner-only': LoadingSpinnerOnly,
  'loading-inline-label': LoadingInlineLabel,
  'loading-full-page-skeleton': LoadingFullPageSkeleton,
  'loading-list-skeleton': LoadingListSkeleton,
  'loading-card-grid-skeleton': LoadingCardGridSkeleton,
  'loading-progress-bar': LoadingProgressBar,
  'loading-indeterminate-shimmer': LoadingIndeterminateShimmer,
  'loading-button-matrix': LoadingButtonMatrix,
  'loading-skeleton-shimmer': LoadingSkeletonShimmer,
  'loading-long-task': LoadingLongTask,
};

export function LoadingExplorations() {
  const variants = getVariantsByCategory('loading');
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
