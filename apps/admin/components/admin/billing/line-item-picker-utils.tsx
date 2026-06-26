'use client';

import * as React from 'react';

import { BillingLineItemPicker } from '@/components/admin/billing/BillingLineItemPicker';
import type { LineItemRow } from '@/components/admin/billing/LineItemsTable';
import type { OfferingOption, ProductOption } from '@/src/lib/billing/billing-bootstrap';
import type { LineItemKind } from '@/src/lib/billing/line-item-kinds';

export function applyLineItemKindChange(
  current: LineItemRow,
  patch: Partial<LineItemRow>,
): Partial<LineItemRow> {
  if (!patch.kind || patch.kind === current.kind) return patch;
  const next: Partial<LineItemRow> = {
    ...patch,
    serviceId: null,
    productId: null,
    description: '',
  };
  if (patch.kind === 'service' || patch.kind === 'custom') {
    next.isBillable = true;
  } else if (patch.kind === 'product' || patch.kind === 'material') {
    next.isBillable = true;
  }
  return next;
}

export function LineItemPickerSlot({
  row,
  offerings,
  products,
  materials,
  disabled,
  onChange,
}: {
  row: LineItemRow;
  offerings: ReadonlyArray<OfferingOption>;
  products: ReadonlyArray<ProductOption>;
  materials: ReadonlyArray<ProductOption>;
  disabled?: boolean;
  onChange: (patch: Partial<LineItemRow>) => void;
}): React.ReactElement | null {
  const rowRef = React.useRef(row);
  rowRef.current = row;

  const valueId = row.kind === 'service' ? row.serviceId : row.productId;

  return (
    <BillingLineItemPicker
      key={`${row.key}-${row.kind}`}
      instanceKey={row.key}
      kind={row.kind}
      offerings={offerings}
      products={products}
      materials={materials}
      valueId={valueId}
      valueLabel={row.description}
      disabled={disabled}
      onSelect={(selection) => {
        const current = rowRef.current;
        if (!selection) {
          onChange({
            serviceId: null,
            productId: null,
            description: '',
          });
          return;
        }
        if (current.kind === 'service') {
          onChange({
            kind: 'service',
            serviceId: selection.id,
            productId: null,
            description: selection.name,
            unitPrice: selection.unitPrice ?? current.unitPrice,
          });
          return;
        }
        onChange({
          kind: current.kind === 'material' ? 'material' : 'product',
          productId: selection.id,
          serviceId: null,
          description: selection.name,
          unitPrice: selection.unitPrice ?? current.unitPrice,
        });
      }}
    />
  );
}

export type BillingEditorCatalogProps = {
  offerings: ReadonlyArray<OfferingOption>;
  products: ReadonlyArray<ProductOption>;
  materials: ReadonlyArray<ProductOption>;
};

export function lineItemChangeHandler(
  dispatch: React.Dispatch<{ type: 'change-line'; key: string; patch: Partial<LineItemRow> }>,
) {
  return (key: string, patch: Partial<LineItemRow>) => {
    dispatch({ type: 'change-line', key, patch });
  };
}

export function renderLineItemPicker(
  catalog: BillingEditorCatalogProps,
  disabled: boolean | undefined,
  onChange: (key: string, patch: Partial<LineItemRow>) => void,
) {
  return (row: LineItemRow) => (
    <LineItemPickerSlot
      key={row.key}
      row={row}
      offerings={catalog.offerings}
      products={catalog.products}
      materials={catalog.materials}
      disabled={disabled}
      onChange={(patch) => onChange(row.key, patch)}
    />
  );
}

export type { LineItemKind };
