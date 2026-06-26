'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { SidebarClassicGrouped } from '@/components/design/explorations/sidebar/Variation01';
import { SidebarCollapsibleSections } from '@/components/design/explorations/sidebar/Variation02';
import { SidebarIconRail } from '@/components/design/explorations/sidebar/Variation03';
import { SidebarDoublePane } from '@/components/design/explorations/sidebar/Variation04';
import { SidebarSearchLed } from '@/components/design/explorations/sidebar/Variation05';
import { SidebarPinnedRecent } from '@/components/design/explorations/sidebar/Variation06';
import { SidebarActivityCards } from '@/components/design/explorations/sidebar/Variation07';
import { SidebarWorkspaceSwitcher } from '@/components/design/explorations/sidebar/Variation08';
import { SidebarFloatingIsland } from '@/components/design/explorations/sidebar/Variation09';
import { SidebarAgentPrompt } from '@/components/design/explorations/sidebar/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'sidebar-classic-grouped': SidebarClassicGrouped,
  'sidebar-collapsible-sections': SidebarCollapsibleSections,
  'sidebar-icon-rail': SidebarIconRail,
  'sidebar-double-pane': SidebarDoublePane,
  'sidebar-search-led': SidebarSearchLed,
  'sidebar-pinned-recent': SidebarPinnedRecent,
  'sidebar-activity-cards': SidebarActivityCards,
  'sidebar-workspace-switcher': SidebarWorkspaceSwitcher,
  'sidebar-floating-island': SidebarFloatingIsland,
  'sidebar-agent-prompt': SidebarAgentPrompt,
};

export function SidebarExplorations() {
  const variants = getVariantsByCategory('sidebar');
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
