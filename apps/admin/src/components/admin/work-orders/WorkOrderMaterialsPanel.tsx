'use client';

import { ExternalLink } from 'lucide-react';
import * as React from 'react';

import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { WorkOrderMaterialDetail } from '@/src/lib/operations/accept-estimate';

const STOCK_LABEL: Record<WorkOrderMaterialDetail['stockStatus'], string> = {
  in_stock: 'In stock',
  low: 'Low',
  out: 'Need to buy',
  unknown: 'Unknown',
};

const STOCK_VARIANT: Record<
  WorkOrderMaterialDetail['stockStatus'],
  'success' | 'warning' | 'error' | 'outline'
> = {
  in_stock: 'success',
  low: 'warning',
  out: 'error',
  unknown: 'outline',
};

export function WorkOrderMaterialsPanel({
  materials,
}: {
  materials: ReadonlyArray<WorkOrderMaterialDetail>;
}): React.ReactElement {
  return (
    <FieldsetSurface
      eyebrow="Fulfillment"
      title="Materials"
      description="Job materials with inventory status. No customer pricing on this view."
    >
      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No materials on this work order yet. Materials are added when an estimate is accepted.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table variant="default">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="w-24 text-right">Qty</TableHead>
                <TableHead className="w-28 text-center">Stock</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <span className="text-sm font-medium">{row.productName}</span>
                    {row.notes ? (
                      <p className="text-xs text-muted-foreground">{row.notes}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {row.quantity}
                    {row.unitOfMeasure ? ` ${row.unitOfMeasure}` : ''}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={STOCK_VARIANT[row.stockStatus]}>
                      {STOCK_LABEL[row.stockStatus]}
                    </Badge>
                    {row.quantityOnHand != null ? (
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {row.quantityOnHand} on hand
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {row.purchaseUrl ? (
                      <a
                        href={row.purchaseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Purchase
                        <ExternalLink className="size-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </FieldsetSurface>
  );
}
