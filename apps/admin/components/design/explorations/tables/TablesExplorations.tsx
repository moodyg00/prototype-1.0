'use client';

import * as React from 'react';
import { VariationFrame } from '@/components/design/VariationFrame';
import { FAVORITES, getVariantsByCategory } from '@/src/design/manifest';
import { TableClassicBordered } from '@/components/design/explorations/tables/Variation01';
import { TableMinimalHoverLanes } from '@/components/design/explorations/tables/Variation02';
import { TableDensePower } from '@/components/design/explorations/tables/Variation03';
import { TableSelectionBulkActions } from '@/components/design/explorations/tables/Variation04';
import { TableExpandableDetail } from '@/components/design/explorations/tables/Variation05';
import { TableInlineEditable } from '@/components/design/explorations/tables/Variation06';
import { TableCardRows } from '@/components/design/explorations/tables/Variation07';
import { TableStickyFirstColumn } from '@/components/design/explorations/tables/Variation08';
import { TableZebraGrouped } from '@/components/design/explorations/tables/Variation09';
import { TableSpreadsheetGrid } from '@/components/design/explorations/tables/Variation10';

const COMPONENT_BY_SLUG: Record<string, React.ComponentType> = {
  'table-classic-bordered': TableClassicBordered,
  'table-minimal-hover-lanes': TableMinimalHoverLanes,
  'table-dense-power': TableDensePower,
  'table-selection-bulk-actions': TableSelectionBulkActions,
  'table-expandable-detail': TableExpandableDetail,
  'table-inline-editable': TableInlineEditable,
  'table-card-rows': TableCardRows,
  'table-sticky-first-column': TableStickyFirstColumn,
  'table-zebra-grouped': TableZebraGrouped,
  'table-spreadsheet-grid': TableSpreadsheetGrid,
};

export function TablesExplorations() {
  const variants = getVariantsByCategory('tables');
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
