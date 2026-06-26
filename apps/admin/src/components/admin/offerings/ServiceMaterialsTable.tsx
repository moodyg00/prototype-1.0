'use client';

import { Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ServiceMaterialDetail } from '@/src/lib/operations/service-service';

import { ProductPickerForBom } from './ProductPickerForBom';

export type ServiceMaterialRow = {
  key: string;
  productId: string | null;
  productName: string;
  productCategory: string;
  defaultQuantity: string;
  isOptional: boolean;
  notes: string;
  quantityOnHand: string | null;
  unitOfMeasure: string | null;
};

export function serviceMaterialRowsFromDetail(
  materials: ReadonlyArray<ServiceMaterialDetail>,
): ServiceMaterialRow[] {
  return materials.map((row) => ({
    key: row.id,
    productId: row.productId,
    productName: row.productName,
    productCategory: row.productCategory,
    defaultQuantity: row.defaultQuantity,
    isOptional: row.isOptional,
    notes: row.notes ?? '',
    quantityOnHand: row.quantityOnHand,
    unitOfMeasure: row.unitOfMeasure,
  }));
}

export function newServiceMaterialRow(): ServiceMaterialRow {
  return {
    key: `mat-${crypto.randomUUID()}`,
    productId: null,
    productName: '',
    productCategory: '',
    defaultQuantity: '1',
    isOptional: false,
    notes: '',
    quantityOnHand: null,
    unitOfMeasure: null,
  };
}

export function ServiceMaterialsTable({
  rows,
  onAdd,
  onRemove,
  onChange,
  disabled,
  errors,
}: {
  rows: ReadonlyArray<ServiceMaterialRow>;
  onAdd: () => void;
  onRemove: (key: string) => void;
  onChange: (key: string, patch: Partial<ServiceMaterialRow>) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
}): React.ReactElement {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Define default materials and internal consumables used when this service is performed.
        </p>
        <Button type="button" className="mt-4" variant="outline" onClick={onAdd} disabled={disabled}>
          <Plus className="size-4" />
          Add material
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
              <TableHead>Product</TableHead>
              <TableHead className="w-24 text-right">Default qty</TableHead>
              <TableHead className="w-24 text-center">On hand</TableHead>
              <TableHead className="w-20 text-center">Optional</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.key}>
                <TableCell className="min-w-[200px]">
                  <ProductPickerForBom
                    value={row.productId}
                    label={row.productName}
                    disabled={disabled}
                    onSelect={(product) =>
                      onChange(row.key, {
                        productId: product?.id ?? null,
                        productName: product?.name ?? '',
                        productCategory: product?.category ?? '',
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    className="text-right"
                    value={row.defaultQuantity}
                    disabled={disabled}
                    onChange={(event) => onChange(row.key, { defaultQuantity: event.target.value })}
                    aria-invalid={errors?.[`materials.${index}.defaultQuantity`] ? true : undefined}
                  />
                </TableCell>
                <TableCell className="text-center text-sm text-muted-foreground">
                  {row.quantityOnHand != null
                    ? `${row.quantityOnHand}${row.unitOfMeasure ? ` ${row.unitOfMeasure}` : ''}`
                    : '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={row.isOptional}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onChange(row.key, { isOptional: checked === true })
                    }
                    aria-label="Optional material"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.notes}
                    disabled={disabled}
                    placeholder="Crew notes"
                    onChange={(event) => onChange(row.key, { notes: event.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => onRemove(row.key)}
                    aria-label="Remove material"
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
        Add material
      </Button>
      {errors?.materials ? (
        <p className="text-xs text-destructive">{errors.materials}</p>
      ) : null}
    </div>
  );
}

export function serviceMaterialsPayload(rows: ServiceMaterialRow[]) {
  return rows
    .filter((row) => row.productId)
    .map((row) => ({
      productId: row.productId!,
      defaultQuantity: row.defaultQuantity.trim() || '1',
      isOptional: row.isOptional,
      notes: row.notes.trim() || null,
    }));
}
