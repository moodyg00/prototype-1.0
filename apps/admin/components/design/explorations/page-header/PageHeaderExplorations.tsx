'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { PageHeaderSimple } from '@/components/design/explorations/page-header/Variation01';
import { PageHeaderBreadcrumbDetail } from '@/components/design/explorations/page-header/Variation02';
import { PageHeaderWithTabs } from '@/components/design/explorations/page-header/Variation03';
import { PageHeaderStatusMeta } from '@/components/design/explorations/page-header/Variation04';
import { PageHeaderHeroStats } from '@/components/design/explorations/page-header/Variation05';
import { PageHeaderStickyCompact } from '@/components/design/explorations/page-header/Variation06';
import { PageHeaderAvatarRecord } from '@/components/design/explorations/page-header/Variation07';
import { PageHeaderSearchLed } from '@/components/design/explorations/page-header/Variation08';
import { PageHeaderSplitActions } from '@/components/design/explorations/page-header/Variation09';
import { PageHeaderEditorial } from '@/components/design/explorations/page-header/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'page-header-simple': PageHeaderSimple,
  'page-header-breadcrumb-detail': PageHeaderBreadcrumbDetail,
  'page-header-with-tabs': PageHeaderWithTabs,
  'page-header-status-meta': PageHeaderStatusMeta,
  'page-header-hero-stats': PageHeaderHeroStats,
  'page-header-sticky-compact': PageHeaderStickyCompact,
  'page-header-avatar-record': PageHeaderAvatarRecord,
  'page-header-search-led': PageHeaderSearchLed,
  'page-header-split-actions': PageHeaderSplitActions,
  'page-header-editorial': PageHeaderEditorial,
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
            afterPreview={
              <div
                className="px-6 py-12 text-center text-sm"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Page body content area — page header sits above this
              </div>
            }
          >
            <Component />
          </VariationFrame>
        );
      })}
    </div>
  );
}
