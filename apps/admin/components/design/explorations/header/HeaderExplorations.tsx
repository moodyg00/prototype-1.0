'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { HeaderClassicShell } from '@/components/design/explorations/header/Variation01';
import { HeaderCommandBar } from '@/components/design/explorations/header/Variation02';
import { HeaderMonolineBreadcrumb } from '@/components/design/explorations/header/Variation03';
import { HeaderDenseUtility } from '@/components/design/explorations/header/Variation04';
import { HeaderFloatingPill } from '@/components/design/explorations/header/Variation05';
import { HeaderSplitTabs } from '@/components/design/explorations/header/Variation06';
import { HeaderMegaMenu } from '@/components/design/explorations/header/Variation07';
import { HeaderAgentPrompt } from '@/components/design/explorations/header/Variation08';
import { HeaderContextStatus } from '@/components/design/explorations/header/Variation09';
import { HeaderEditorial } from '@/components/design/explorations/header/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'header-classic-shell': HeaderClassicShell,
  'header-command-bar': HeaderCommandBar,
  'header-monoline-breadcrumb': HeaderMonolineBreadcrumb,
  'header-dense-utility': HeaderDenseUtility,
  'header-floating-pill': HeaderFloatingPill,
  'header-split-tabs': HeaderSplitTabs,
  'header-mega-menu': HeaderMegaMenu,
  'header-agent-prompt': HeaderAgentPrompt,
  'header-context-status': HeaderContextStatus,
  'header-editorial': HeaderEditorial,
};

export function HeaderExplorations() {
  const variants = getVariantsByCategory('header');
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
                Page content area — header sits above this
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
