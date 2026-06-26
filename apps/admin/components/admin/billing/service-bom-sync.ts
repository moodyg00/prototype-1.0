'use client';

import type { LineItemRow } from '@/components/admin/billing/LineItemsTable';
import { blankLine } from '@/src/hooks/admin/useBillingDocumentForm';
import { toAmountString, toDecimal } from '@/src/lib/accounting/money';

export type ServiceBomMaterial = {
  productId: string;
  productName: string;
  defaultQuantity: string;
  unitPrice: string | null;
  notes: string | null;
};

export async function fetchOfferingBomMaterials(
  serviceId: string,
): Promise<ServiceBomMaterial[]> {
  const res = await fetch(`/api/admin/offerings/${serviceId}/materials`, {
    cache: 'no-store',
  });
  const body = (await res.json()) as {
    materials?: Array<{
      productId: string;
      productName: string;
      defaultQuantity: string;
      unitPrice?: string | null;
      notes: string | null;
    }>;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(body.error ?? 'Could not load offering materials.');
  }
  return (body.materials ?? []).map((row) => ({
    productId: row.productId,
    productName: row.productName,
    defaultQuantity: row.defaultQuantity,
    unitPrice: row.unitPrice ?? null,
    notes: row.notes,
  }));
}

export function stripBomLinesForSource(
  lines: ReadonlyArray<LineItemRow>,
  sourceKey: string,
): LineItemRow[] {
  return lines.filter((line) => line.bomSourceKey !== sourceKey);
}

export function stripLegacyBomMaterialLines(
  lines: ReadonlyArray<LineItemRow>,
  productIds: ReadonlySet<string>,
): LineItemRow[] {
  if (productIds.size === 0) return [...lines];
  return lines.filter(
    (line) =>
      !(
        line.kind === 'material' &&
        line.productId &&
        productIds.has(line.productId) &&
        !line.bomSourceKey
      ),
  );
}

export function buildBomMaterialRows(
  sourceKey: string,
  serviceLine: Pick<LineItemRow, 'quantity'>,
  materials: ReadonlyArray<ServiceBomMaterial>,
): LineItemRow[] {
  const serviceQty = toDecimal(serviceLine.quantity || '1');
  return materials.map((bom) => {
    const bomQty = toDecimal(bom.defaultQuantity || '1');
    return blankLine({
      kind: 'material',
      bomSourceKey: sourceKey,
      productId: bom.productId,
      description: bom.productName,
      quantity: toAmountString(bomQty.mul(serviceQty)),
      unitPrice: bom.unitPrice ?? '0',
      notes: bom.notes ?? '',
      isBillable: true,
    });
  });
}

export function insertBomLinesAfterSource(
  lines: ReadonlyArray<LineItemRow>,
  sourceKey: string,
  bomLines: LineItemRow[],
): LineItemRow[] {
  const without = stripBomLinesForSource(lines, sourceKey);
  const sourceIndex = without.findIndex((line) => line.key === sourceKey);
  if (sourceIndex < 0) return [...without, ...bomLines];
  const next = without.slice();
  next.splice(sourceIndex + 1, 0, ...bomLines);
  return next;
}

export async function syncBomLinesForServiceRow(
  lines: ReadonlyArray<LineItemRow>,
  sourceKey: string,
  serviceLine: LineItemRow,
  previousServiceId?: string | null,
): Promise<LineItemRow[]> {
  let next = stripBomLinesForSource(lines, sourceKey);

  if (previousServiceId && previousServiceId !== serviceLine.serviceId) {
    try {
      const oldBom = await fetchOfferingBomMaterials(previousServiceId);
      next = stripLegacyBomMaterialLines(
        next,
        new Set(oldBom.map((row) => row.productId)),
      );
    } catch {
      // Keep existing material lines when the prior offering BOM cannot be loaded.
    }
  }

  if (serviceLine.kind !== 'service' || !serviceLine.serviceId) {
    return next;
  }

  const materials = await fetchOfferingBomMaterials(serviceLine.serviceId);
  if (materials.length === 0) {
    return next;
  }

  const bomLines = buildBomMaterialRows(sourceKey, serviceLine, materials);
  return insertBomLinesAfterSource(next, sourceKey, bomLines);
}
