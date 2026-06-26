'use client';

/*
 * Inline-editable line-item table for invoices and estimates. Generated
 * initially from the design library variant `table-inline-editable` and then
 * customized: every cell is always editable, drag-handles are exposed when
 * `reorderable` is true, and totals are computed live from
 * `quantity * unitPrice`.
 */

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, toAmountString, toDecimal } from '@/src/lib/accounting/money';
import {
  LINE_ITEM_KIND_LABELS,
  LINE_ITEM_KIND_OPTIONS,
  lineItemKindHasPicker,
  type LineItemKind,
} from '@/src/lib/billing/line-item-kinds';
import { cn } from '@/src/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

import { LineItemsEmptyState } from './LineItemsEmptyState';

export type { LineItemKind } from '@/src/lib/billing/line-item-kinds';

export interface LineItemRow {
  key: string;
  kind: LineItemKind;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  notes: string;
  /** When false, line is excluded from customer-facing totals. */
  isBillable: boolean;
  /** Client-only: service line `key` that auto-added this material row. */
  bomSourceKey?: string | null;
}

export interface LineItemsTableProps {
  rows: ReadonlyArray<LineItemRow>;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (key: string, patch: Partial<LineItemRow>) => void;
  onReorder?: (sourceKey: string, targetKey: string) => void;
  reorderable?: boolean;
  disabled?: boolean;
  errors?: Record<string, string>;
  /** Optional inline picker; if supplied, rendered above each description input. */
  renderPicker?: (row: LineItemRow, index: number) => React.ReactNode;
}

function lineTotal(row: Pick<LineItemRow, 'quantity' | 'unitPrice' | 'isBillable'>): string {
  if (row.isBillable === false) return '0';
  const qty = toDecimal(row.quantity || '0');
  const unit = toDecimal(row.unitPrice || '0');
  return toAmountString(qty.mul(unit));
}

function lineKindShowsBillableToggle(kind: LineItemKind): boolean {
  return kind === 'product' || kind === 'material';
}

export function LineItemsTable({
  rows,
  onAdd,
  onRemove,
  onChange,
  onReorder,
  reorderable = false,
  disabled = false,
  errors,
  renderPicker,
}: LineItemsTableProps): React.ReactElement {
  const dragKeyRef = React.useRef<string | null>(null);

  if (rows.length === 0) {
    return <LineItemsEmptyState onAddLine={onAdd} />;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border">
        <Table variant="default">
          <TableHeader>
            <TableRow>
              {reorderable ? <TableHead className="w-8" aria-label="Drag handle" /> : null}
              <TableHead className="w-28">Kind</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-32 text-right">Unit price</TableHead>
              <TableHead className="w-28 text-center">Charge</TableHead>
              <TableHead className="w-32 text-right">Total</TableHead>
              <TableHead className="w-12" aria-label="row actions" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow
                key={row.key}
                draggable={reorderable && !disabled}
                onDragStart={(event) => {
                  if (!reorderable || disabled) return;
                  dragKeyRef.current = row.key;
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(event) => {
                  if (!reorderable || disabled) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  if (!reorderable || disabled) return;
                  event.preventDefault();
                  const source = dragKeyRef.current;
                  dragKeyRef.current = null;
                  if (!source || source === row.key) return;
                  onReorder?.(source, row.key);
                }}
                className={cn(
                  reorderable ? 'group cursor-grab active:cursor-grabbing' : undefined,
                  row.isBillable === false && 'opacity-60',
                )}
                data-row-key={row.key}
              >
                {reorderable ? (
                  <TableCell className="w-8 align-middle text-[var(--muted-foreground)]">
                    <GripVertical aria-hidden className="size-4" />
                  </TableCell>
                ) : null}
                <TableCell className="align-top">
                  <Select
                    value={row.kind}
                    onValueChange={(next) =>
                      onChange(row.key, { kind: (next as LineItemKind) ?? 'custom' })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue>
                        {(value) =>
                          LINE_ITEM_KIND_LABELS[(value as LineItemKind) ?? 'custom'] ?? 'Custom'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectPopup>
                      {LINE_ITEM_KIND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </TableCell>
                <TableCell className="align-top">
                  <div className="space-y-2">
                    {renderPicker && lineItemKindHasPicker(row.kind) ? (
                      renderPicker(row, index)
                    ) : (
                      <Input
                        value={row.description}
                        onChange={(event) =>
                          onChange(row.key, { description: event.target.value })
                        }
                        placeholder="Line description"
                        size="sm"
                        disabled={disabled}
                        aria-invalid={
                          errors?.[`lineItems.${index}.description`] ? true : undefined
                        }
                      />
                    )}
                    {errors?.[`lineItems.${index}.description`] ? (
                      <p className="text-left text-xs" style={{ color: 'var(--destructive)' }}>
                        {errors[`lineItems.${index}.description`]}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top text-right">
                  <div className="space-y-1">
                    <Input
                      value={row.quantity}
                      onChange={(event) => onChange(row.key, { quantity: event.target.value })}
                      inputMode="decimal"
                      placeholder="1"
                      className="text-right font-mono"
                      size="sm"
                      disabled={disabled}
                      aria-invalid={errors?.[`lineItems.${index}.quantity`] ? true : undefined}
                    />
                    {errors?.[`lineItems.${index}.quantity`] ? (
                      <p className="text-left text-xs" style={{ color: 'var(--destructive)' }}>
                        {errors[`lineItems.${index}.quantity`]}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top text-right">
                  <div className="space-y-1">
                    <Input
                      value={row.unitPrice}
                      onChange={(event) => onChange(row.key, { unitPrice: event.target.value })}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="text-right font-mono"
                      size="sm"
                      disabled={disabled}
                      aria-invalid={errors?.[`lineItems.${index}.unitPrice`] ? true : undefined}
                    />
                    {errors?.[`lineItems.${index}.unitPrice`] ? (
                      <p className="text-left text-xs" style={{ color: 'var(--destructive)' }}>
                        {errors[`lineItems.${index}.unitPrice`]}
                      </p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="align-top text-center">
                  {lineKindShowsBillableToggle(row.kind) ? (
                    <Label className="inline-flex cursor-pointer items-center justify-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                      <Checkbox
                        checked={row.isBillable !== false}
                        onCheckedChange={(checked) =>
                          onChange(row.key, { isBillable: checked === true })
                        }
                        disabled={disabled}
                        aria-label="Charge customer for this line"
                      />
                      <span className="sr-only sm:not-sr-only">Customer</span>
                    </Label>
                  ) : (
                    <span className="text-xs text-[var(--muted-foreground)]">—</span>
                  )}
                </TableCell>
                <TableCell
                  className={cn(
                    'align-top text-right font-mono text-sm tabular-nums',
                    row.isBillable === false && 'text-[var(--muted-foreground)] line-through',
                  )}
                >
                  {formatCurrency(lineTotal(row))}
                </TableCell>
                <TableCell className="align-top text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove line"
                    disabled={disabled || rows.length <= 1}
                    onClick={() => onRemove(row.key)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={disabled}>
          <Plus aria-hidden /> Add line item
        </Button>
      </div>
    </div>
  );
}
