'use client';

import * as React from 'react';

import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import {
  LineItemsTable,
  type LineItemRow,
} from '@/components/admin/billing/LineItemsTable';

type LineItemsFieldsetProps = {
  rows: ReadonlyArray<LineItemRow>;
  disabled?: boolean;
  errors?: Record<string, string>;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (key: string, patch: Partial<LineItemRow>) => void;
  onReorder: (sourceKey: string, targetKey: string) => void;
  description?: React.ReactNode;
  toolbar?: React.ReactNode;
  renderPicker?: (row: LineItemRow, index: number) => React.ReactNode;
};

export function LineItemsFieldset({
  rows,
  disabled,
  errors,
  onAdd,
  onRemove,
  onChange,
  onReorder,
  description,
  toolbar,
  renderPicker,
}: LineItemsFieldsetProps): React.ReactElement {
  return (
    <FieldsetSurface
      eyebrow="Items"
      title="Line items"
      description={
        description ?? 'Drag rows to reorder. Quantity × unit price drives the line total.'
      }
      toolbar={toolbar}
      contentClassName="space-y-3"
    >
      <LineItemsTable
        rows={rows}
        onAdd={onAdd}
        onRemove={onRemove}
        onChange={onChange}
        onReorder={onReorder}
        reorderable
        disabled={disabled}
        errors={errors}
        renderPicker={renderPicker}
      />
      {errors?.lineItems ? (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
          {errors.lineItems}
        </p>
      ) : null}
    </FieldsetSurface>
  );
}
