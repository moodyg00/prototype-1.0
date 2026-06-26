'use client';

import { ExternalLink } from 'lucide-react';
import * as React from 'react';

import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import type { LineItemRow } from '@/components/admin/billing/LineItemsTable';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EstimateMaterialRow } from '@/src/lib/operations/estimate-materials';

const STOCK_LABEL: Record<EstimateMaterialRow['stockStatus'], string> = {
  in_stock: 'In stock',
  low: 'Low',
  out: 'Need to buy',
  unknown: 'Unknown',
};

const STOCK_VARIANT: Record<
  EstimateMaterialRow['stockStatus'],
  'success' | 'warning' | 'error' | 'outline'
> = {
  in_stock: 'success',
  low: 'warning',
  out: 'error',
  unknown: 'outline',
};

export function MaterialsNeededTable({
  materials,
  mode,
}: {
  materials: ReadonlyArray<EstimateMaterialRow>;
  mode: 'preview' | 'snapshot' | 'live';
}): React.ReactElement {
  if (materials.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No materials derived yet. Add offering lines with BOM entries or material line items on
        this estimate.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {mode === 'snapshot'
          ? 'Frozen material list from when this estimate was accepted.'
          : mode === 'live'
            ? 'Live preview from current line items and service BOMs.'
            : 'Live preview from saved line items and current service BOMs.'}
      </p>
      <div className="overflow-hidden rounded-lg border">
        <Table variant="default">
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="w-24 text-right">Qty</TableHead>
              <TableHead className="w-28 text-center">Stock</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((row) => (
              <TableRow key={`${row.productId ?? row.productName}-${row.source}`}>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{row.productName}</span>
                    <span className="text-xs text-muted-foreground">
                      {[row.productCategory, row.serviceName].filter(Boolean).join(' · ')}
                      {row.isOptional ? ' · Optional' : ''}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {row.quantity}
                  {row.unitOfMeasure ? ` ${row.unitOfMeasure}` : ''}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={STOCK_VARIANT[row.stockStatus]}>{STOCK_LABEL[row.stockStatus]}</Badge>
                  {row.quantityOnHand != null ? (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {row.quantityOnHand} on hand
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs capitalize text-muted-foreground">
                  {row.source === 'bom' ? 'Service BOM' : 'Product line'}
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
    </div>
  );
}

function lineItemsPreviewPayload(lineItems: ReadonlyArray<LineItemRow>) {
  return lineItems.map(({ kind, serviceId, productId, description, quantity, notes }) => ({
    kind: serviceId ? 'service' : kind,
    serviceId,
    productId,
    description,
    quantity,
    notes,
  }));
}

function lineItemsCanDeriveMaterials(lineItems: ReadonlyArray<LineItemRow>): boolean {
  return lineItems.some(
    (line) =>
      (line.kind === 'service' && line.serviceId) ||
      ((line.kind === 'product' || line.kind === 'material') && line.productId),
  );
}

export function EstimateMaterialsLivePreview({
  lineItems,
  enabled = true,
}: {
  lineItems: ReadonlyArray<LineItemRow>;
  enabled?: boolean;
}): React.ReactElement {
  const [materials, setMaterials] = React.useState<EstimateMaterialRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const payload = React.useMemo(() => lineItemsPreviewPayload(lineItems), [lineItems]);
  const payloadKey = React.useMemo(() => JSON.stringify(payload), [payload]);
  const canDerive = lineItemsCanDeriveMaterials(lineItems);

  React.useEffect(() => {
    if (!enabled) return;

    let active = true;
    if (canDerive) {
      setLoading(true);
      setError(null);
    } else {
      setMaterials([]);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/admin/estimates/materials/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineItems: payload }),
            cache: 'no-store',
          });
          const body = (await res.json()) as {
            materials?: EstimateMaterialRow[];
            error?: string;
          };
          if (!active) return;
          if (!res.ok) {
            setError(body.error ?? 'Could not preview materials.');
            setMaterials([]);
            return;
          }
          setMaterials(body.materials ?? []);
        } catch {
          if (active) {
            setError('Could not preview materials.');
            setMaterials([]);
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [enabled, payload, payloadKey, canDerive]);

  return (
    <FieldsetSurface
      eyebrow="Fulfillment"
      title="Materials needed"
      description="Products and internal consumables required to perform the quoted services."
    >
      {loading && materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading materials…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <MaterialsNeededTable materials={materials} mode="live" />
      )}
    </FieldsetSurface>
  );
}

export function EstimateMaterialsPanel({
  estimateId,
  initialMaterials,
  initialMode,
  refreshKey,
}: {
  estimateId: string;
  initialMaterials: ReadonlyArray<EstimateMaterialRow>;
  initialMode: 'preview' | 'snapshot';
  refreshKey?: number;
}): React.ReactElement {
  const [materials, setMaterials] = React.useState(initialMaterials);
  const [mode, setMode] = React.useState(initialMode);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialMode === 'snapshot') return;
    let active = true;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/estimates/${estimateId}/materials`, {
          cache: 'no-store',
        });
        const body = (await res.json()) as {
          materials?: EstimateMaterialRow[];
          mode?: 'preview' | 'snapshot';
        };
        if (active && res.ok) {
          setMaterials(body.materials ?? []);
          setMode(body.mode ?? 'preview');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [estimateId, initialMode, refreshKey]);

  return (
    <FieldsetSurface
      eyebrow="Fulfillment"
      title="Materials needed"
      description="Products and internal consumables required to perform the quoted services."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading materials…</p>
      ) : (
        <MaterialsNeededTable materials={materials} mode={mode} />
      )}
    </FieldsetSurface>
  );
}
