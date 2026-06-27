'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { PageHeaderSimple } from '@/components/design/explorations/page-header/Variation01';
import { PageHeaderBreadcrumbDetail } from '@/components/design/explorations/page-header/Variation02';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'page-header-simple': PageHeaderSimple,
  'page-header-breadcrumb-detail': PageHeaderBreadcrumbDetail,
};

export function PageHeaderExplorations() {
  const variants = getVariantsByCategory('page-header');
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
