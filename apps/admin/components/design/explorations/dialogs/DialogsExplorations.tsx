'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { DialogClassicCentered } from '@/components/design/explorations/dialogs/Variation01';
import { DialogAlertDestructive } from '@/components/design/explorations/dialogs/Variation02';
import { DialogFormGrid } from '@/components/design/explorations/dialogs/Variation03';
import { DialogFullScreen } from '@/components/design/explorations/dialogs/Variation04';
import { DialogBottomSheet } from '@/components/design/explorations/dialogs/Variation05';
import { DialogWizard } from '@/components/design/explorations/dialogs/Variation06';
import { DialogRightDrawer } from '@/components/design/explorations/dialogs/Variation07';
import { DialogCommandPalette } from '@/components/design/explorations/dialogs/Variation08';
import { DialogSidebarTabs } from '@/components/design/explorations/dialogs/Variation09';
import { DialogCompactPopover } from '@/components/design/explorations/dialogs/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'dialog-classic-centered': DialogClassicCentered,
  'dialog-alert-destructive': DialogAlertDestructive,
  'dialog-form-grid': DialogFormGrid,
  'dialog-full-screen': DialogFullScreen,
  'dialog-bottom-sheet': DialogBottomSheet,
  'dialog-wizard': DialogWizard,
  'dialog-right-drawer': DialogRightDrawer,
  'dialog-command-palette': DialogCommandPalette,
  'dialog-sidebar-tabs': DialogSidebarTabs,
  'dialog-compact-popover': DialogCompactPopover,
};

export function DialogsExplorations() {
  const variants = getVariantsByCategory('dialogs');
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
