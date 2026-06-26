import 'server-only';

import { Prisma } from '@prototype/db';

import { toDecimal } from '@/src/lib/accounting/money';
import { prisma } from '@/src/lib/prisma';
import {
  collectRawMaterialLines,
  loadEstimateItemsWithBom,
  toMaterialCollectionItem,
  type MaterialCollectionItem,
  type RawMaterialLine,
  type ServiceBomMap,
} from '@/src/lib/operations/estimate-material-lines';
import type { LineItemInput } from '@/src/lib/validation/billing-document';

export type MaterialStockStatus = 'in_stock' | 'low' | 'out' | 'unknown';

export type EstimateMaterialRow = {
  productId: string | null;
  productName: string;
  productCategory: string;
  quantity: string;
  unitOfMeasure: string | null;
  source: 'bom' | 'product_line';
  isOptional: boolean;
  serviceName: string | null;
  quantityOnHand: string | null;
  purchaseUrl: string | null;
  stockStatus: MaterialStockStatus;
  notes: string | null;
};

function decimalQty(value: Prisma.Decimal | number | string): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return toDecimal(value);
}

export function resolveStockStatus(
  needed: Prisma.Decimal,
  onHand: Prisma.Decimal | null,
  reorderLevel: Prisma.Decimal | null,
): MaterialStockStatus {
  if (onHand === null) return 'unknown';
  if (onHand.lt(needed)) return 'out';
  if (reorderLevel !== null && onHand.lte(reorderLevel)) return 'low';
  return 'in_stock';
}

function stockStatus(
  needed: Prisma.Decimal,
  onHand: Prisma.Decimal | null,
  reorderLevel: Prisma.Decimal | null,
): MaterialStockStatus {
  return resolveStockStatus(needed, onHand, reorderLevel);
}

function mergePreviewLines(lines: RawMaterialLine[]): RawMaterialLine[] {
  const map = new Map<string, RawMaterialLine>();
  for (const line of lines) {
    const existing = map.get(line.productId);
    if (!existing) {
      map.set(line.productId, { ...line });
      continue;
    }
    existing.quantity = existing.quantity.add(line.quantity);
    existing.isOptional = existing.isOptional && line.isOptional;
    if (!existing.serviceName && line.serviceName) {
      existing.serviceName = line.serviceName;
    }
    if (!existing.notes && line.notes) {
      existing.notes = line.notes;
    }
  }
  return [...map.values()].sort((a, b) => a.productName.localeCompare(b.productName));
}

async function loadProductContext(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<
      string,
      {
        category: string;
        unitOfMeasure: string | null;
        quantityOnHand: Prisma.Decimal | null;
        reorderLevel: Prisma.Decimal | null;
        purchaseUrl: string | null;
        vendorPurchaseUrl: string | null;
      }
    >();
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      category: true,
      unitOfMeasure: true,
      purchaseUrl: true,
      inventorys: {
        take: 1,
        select: { quantityOnHand: true, reorderLevel: true },
      },
      productVendorLinks: {
        where: { isPreferred: true },
        orderBy: [{ sortOrder: 'asc' }],
        take: 1,
        select: { purchaseUrl: true },
      },
    },
  });

  return new Map(
    products.map((product) => [
      product.id,
      {
        category: product.category,
        unitOfMeasure: product.unitOfMeasure,
        quantityOnHand: product.inventorys[0]?.quantityOnHand ?? null,
        reorderLevel: product.inventorys[0]?.reorderLevel ?? null,
        purchaseUrl: product.purchaseUrl,
        vendorPurchaseUrl: product.productVendorLinks[0]?.purchaseUrl ?? null,
      },
    ]),
  );
}

function toDisplayRow(
  line: RawMaterialLine,
  context: Awaited<ReturnType<typeof loadProductContext>>,
): EstimateMaterialRow {
  const product = context.get(line.productId);
  const onHand = product?.quantityOnHand ?? null;
  return {
    productId: line.productId,
    productName: line.productName,
    productCategory: product?.category ?? line.productCategory,
    quantity: line.quantity.toString(),
    unitOfMeasure: line.unitOfMeasure ?? product?.unitOfMeasure ?? null,
    source: line.source,
    isOptional: line.isOptional,
    serviceName: line.serviceName,
    quantityOnHand: onHand?.toString() ?? null,
    purchaseUrl: product?.purchaseUrl ?? product?.vendorPurchaseUrl ?? null,
    stockStatus: stockStatus(line.quantity, onHand, product?.reorderLevel ?? null),
    notes: line.notes,
  };
}

export async function computeEstimateMaterialsManifest(
  estimateId: string,
): Promise<EstimateMaterialRow[]> {
  const { items, bomMap } = await loadEstimateItemsWithBom(estimateId);
  const merged = mergePreviewLines(
    collectRawMaterialLines(items.map(toMaterialCollectionItem), bomMap),
  );
  const context = await loadProductContext(merged.map((line) => line.productId));
  return merged.map((line) => toDisplayRow(line, context));
}

async function loadBomMapForServices(serviceIds: string[]): Promise<ServiceBomMap> {
  if (serviceIds.length === 0) return new Map();

  const bomRows = await prisma.serviceMaterial.findMany({
    where: { serviceId: { in: serviceIds } },
    include: {
      product: {
        select: { id: true, name: true, category: true, unitOfMeasure: true },
      },
    },
  });

  const bomMap: ServiceBomMap = new Map();
  for (const row of bomRows) {
    const list = bomMap.get(row.serviceId) ?? [];
    list.push(row);
    bomMap.set(row.serviceId, list);
  }
  return bomMap;
}

function toPreviewCollectionItems(
  lines: ReadonlyArray<LineItemInput>,
): MaterialCollectionItem[] {
  return lines.map((line, index) => ({
    lineId: `preview-${index}`,
    kind: line.serviceId ? 'service' : line.kind ?? 'custom',
    serviceId: line.serviceId ?? null,
    productId: line.productId ?? null,
    description: line.description ?? '',
    quantity: line.quantity ?? '1',
    notes: line.notes ?? null,
    serviceName: null,
    isBillable: line.isBillable !== false,
    product: null,
  }));
}

export async function computeMaterialsPreviewFromLineItems(
  lines: ReadonlyArray<LineItemInput>,
): Promise<EstimateMaterialRow[]> {
  const collectionItems = toPreviewCollectionItems(lines);

  const serviceIds = collectionItems
    .filter((item) => item.kind === 'service' && item.serviceId)
    .map((item) => item.serviceId!) as string[];

  const productIds = collectionItems
    .filter(
      (item) =>
        (item.kind === 'product' || item.kind === 'material') && item.productId,
    )
    .map((item) => item.productId!) as string[];

  const [bomMap, products, services] = await Promise.all([
    loadBomMapForServices(serviceIds),
    productIds.length > 0
      ? prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, category: true, unitOfMeasure: true },
        })
      : Promise.resolve([]),
    serviceIds.length > 0
      ? prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const productMap = new Map(products.map((product) => [product.id, product]));
  const serviceNameMap = new Map(services.map((service) => [service.id, service.name]));

  const hydrated = collectionItems.map((item) => ({
    ...item,
    serviceName:
      item.serviceId != null
        ? (serviceNameMap.get(item.serviceId) ?? item.description ?? 'Service')
        : item.serviceName,
    product: item.productId ? (productMap.get(item.productId) ?? null) : null,
  }));

  const merged = mergePreviewLines(collectRawMaterialLines(hydrated, bomMap));
  const context = await loadProductContext(merged.map((line) => line.productId));
  return merged.map((line) => toDisplayRow(line, context));
}

export type EstimateMaterialsResult = {
  mode: 'preview' | 'snapshot';
  materials: EstimateMaterialRow[];
};

export async function getEstimateMaterials(estimateId: string): Promise<EstimateMaterialsResult> {
  const snapshotCount = await prisma.estimateMaterial.count({ where: { estimateId } });
  if (snapshotCount > 0) {
    const rows = await prisma.estimateMaterial.findMany({
      where: { estimateId },
      orderBy: [{ productName: 'asc' }],
    });
    const productIds = rows.map((row) => row.productId).filter(Boolean) as string[];
    const context = await loadProductContext(productIds);

    return {
      mode: 'snapshot',
      materials: rows.map((row) => {
        const product = row.productId ? context.get(row.productId) : undefined;
        const onHand = product?.quantityOnHand ?? null;
        const needed = decimalQty(row.quantity);
        return {
          productId: row.productId,
          productName: row.productName,
          productCategory: product?.category ?? 'other',
          quantity: row.quantity.toString(),
          unitOfMeasure: row.unitOfMeasure ?? product?.unitOfMeasure ?? null,
          source: row.source as 'bom' | 'product_line',
          isOptional: row.isOptional,
          serviceName: row.serviceName,
          quantityOnHand: onHand?.toString() ?? null,
          purchaseUrl: product?.purchaseUrl ?? product?.vendorPurchaseUrl ?? null,
          stockStatus: stockStatus(needed, onHand, product?.reorderLevel ?? null),
          notes: row.notes,
        };
      }),
    };
  }

  return {
    mode: 'preview',
    materials: await computeEstimateMaterialsManifest(estimateId),
  };
}

export type SnapshotMaterialInput = {
  productId: string | null;
  productName: string;
  quantity: string;
  unitOfMeasure: string | null;
  source: 'bom' | 'product_line';
  isOptional: boolean;
  estimateItemId: string | null;
  serviceId: string | null;
  serviceName: string | null;
  notes: string | null;
  isBillable: boolean;
};

export async function buildSnapshotRowsFromManifest(
  estimateId: string,
): Promise<SnapshotMaterialInput[]> {
  const { items, bomMap } = await loadEstimateItemsWithBom(estimateId);
  const raw = collectRawMaterialLines(items.map(toMaterialCollectionItem), bomMap);

  const merged = new Map<string, SnapshotMaterialInput>();
  for (const line of raw) {
    const snapshot: SnapshotMaterialInput = {
      productId: line.productId,
      productName: line.productName,
      quantity: line.quantity.toString(),
      unitOfMeasure: line.unitOfMeasure,
      source: line.source,
      isOptional: line.isOptional,
      estimateItemId: line.estimateItemId,
      serviceId: line.serviceId,
      serviceName: line.serviceName,
      notes: line.notes,
      isBillable: line.isBillable,
    };

    const existing = merged.get(line.productId);
    if (!existing) {
      merged.set(line.productId, snapshot);
      continue;
    }
    existing.quantity = decimalQty(existing.quantity).add(line.quantity).toString();
    existing.isOptional = existing.isOptional && line.isOptional;
    existing.isBillable = existing.isBillable || line.isBillable;
  }

  return [...merged.values()];
}
