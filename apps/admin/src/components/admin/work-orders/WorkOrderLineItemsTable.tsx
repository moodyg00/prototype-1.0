'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ServiceLinePicker } from './ServiceLinePicker';
import type { OfferingOption } from '@/src/lib/billing/billing-bootstrap';

export type WorkOrderLineRow = {
  key: string;
  serviceId: string | null;
  description: string;
  quantity: string;
  notes: string;
};

export function WorkOrderLineItemsTable({
  rows,
  onAdd,
  onRemove,
  onChange,
  onReorder,
  disabled,
  errors,
  offerings,
}: {
  rows: ReadonlyArray<WorkOrderLineRow>;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (key: string, patch: Partial<WorkOrderLineRow>) => void;
  onReorder?: (sourceKey: string, targetKey: string) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  offerings: ReadonlyArray<OfferingOption>;
}): React.ReactElement {
  const dragKeyRef = React.useRef<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Add one or more services to define what this work order covers.
        </p>
        <Button type="button" className="mt-4" variant="outline" onClick={onAdd} disabled={disabled}>
          <Plus className="size-4" />
          Add service line
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <Table variant="default">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" aria-label="Drag handle" />
              <TableHead>Service</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.key}
                draggable={Boolean(onReorder) && !disabled}
                onDragStart={() => {
                  dragKeyRef.current = row.key;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  const source = dragKeyRef.current;
                  dragKeyRef.current = null;
                  if (source && source !== row.key && onReorder) onReorder(source, row.key);
                }}
              >
                <TableCell className="w-8">
                  {onReorder ? (
                    <GripVertical className="size-4 text-[var(--muted-foreground)]" />
                  ) : null}
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <ServiceLinePicker
                    offerings={offerings}
                    value={row.serviceId}
                    label={row.description}
                    disabled={disabled}
                    onSelect={(service) =>
                      onChange(row.key, {
                        serviceId: service?.id ?? null,
                        description: service?.name ?? row.description,
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.description}
                    disabled={disabled}
                    onChange={(event) => onChange(row.key, { description: event.target.value })}
                    aria-invalid={errors?.[`lineItems.${index}.description`] ? true : undefined}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="text-right"
                    value={row.quantity}
                    disabled={disabled}
                    onChange={(event) => onChange(row.key, { quantity: event.target.value })}
                    aria-invalid={errors?.[`lineItems.${index}.quantity`] ? true : undefined}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => onRemove(row.key)}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={disabled}>
        <Plus className="size-4" />
        Add service line
      </Button>
      {errors?.lineItems ? (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
          {errors.lineItems}
        </p>
      ) : null}
    </div>
  );
}

export function newWorkOrderLineRow(): WorkOrderLineRow {
  return {
    key: `line-${crypto.randomUUID()}`,
    serviceId: null,
    description: '',
    quantity: '1',
    notes: '',
  };
}

export function reorderLineRows(
  rows: WorkOrderLineRow[],
  sourceKey: string,
  targetKey: string,
): WorkOrderLineRow[] {
  const sourceIndex = rows.findIndex((row) => row.key === sourceKey);
  const targetIndex = rows.findIndex((row) => row.key === targetKey);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return rows;
  const next = [...rows];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}
