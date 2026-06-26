import 'server-only';

import { Prisma } from '@prototype/db';

import { toDecimal } from '@/src/lib/accounting/money';
import { prisma } from '@/src/lib/prisma';

type RawMaterialLine = {
  productId: string;
  productName: string;
  productCategory: string;
  unitOfMeasure: string | null;
  quantity: Prisma.Decimal;
  source: 'bom' | 'product_line';
  isOptional: boolean;
  isBillable: boolean;
  serviceName: string | null;
  notes: string | null;
  estimateItemId: string;
  serviceId: string | null;
};

export type MaterialCollectionItem = {
  lineId: string;
  kind: string;
  serviceId: string | null;
  productId: string | null;
  description: string;
  quantity: Prisma.Decimal | number | string;
  notes: string | null;
  serviceName: string | null;
  isBillable: boolean;
  product: {
    id: string;
    name: string;
    category: string;
    unitOfMeasure: string | null;
  } | null;
};

type BomRow = {
  defaultQuantity: Prisma.Decimal;
  isOptional: boolean;
  notes: string | null;
  product: {
    id: string;
    name: string;
    category: string;
    unitOfMeasure: string | null;
  };
};

export type ServiceBomMap = Map<string, BomRow[]>;

export function toMaterialCollectionItem(
  item: Awaited<ReturnType<typeof loadEstimateItemsWithBom>>['items'][number],
): MaterialCollectionItem {
  return {
    lineId: item.id,
    kind: item.kind,
    serviceId: item.serviceId,
    productId: item.productId,
    description: item.description ?? '',
    quantity: item.quantity,
    notes: item.notes,
    serviceName: item.service?.name ?? item.description ?? 'Service',
    isBillable: item.isBillable,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          unitOfMeasure: item.product.unitOfMeasure,
        }
      : null,
  };
}

function decimalQty(value: Prisma.Decimal | number | string): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) return value;
  return toDecimal(value);
}

export async function loadEstimateItemsWithBom(estimateId: string) {
  const items = await prisma.estimateItem.findMany({
    where: { estimateId },
    orderBy: [{ sortOrder: 'asc' }],
    include: {
      service: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, category: true, unitOfMeasure: true } },
    },
  });

  const serviceIds = items
    .filter((item) => item.serviceId)
    .map((item) => item.serviceId!) as string[];

  const bomRows =
    serviceIds.length > 0
      ? await prisma.serviceMaterial.findMany({
          where: { serviceId: { in: serviceIds } },
          include: {
            product: {
              select: { id: true, name: true, category: true, unitOfMeasure: true },
            },
          },
        })
      : [];

  const bomMap = new Map<string, typeof bomRows>();
  for (const row of bomRows) {
    const list = bomMap.get(row.serviceId) ?? [];
    list.push(row);
    bomMap.set(row.serviceId, list);
  }

  return { items, bomMap };
}

export function collectRawMaterialLines(
  items: ReadonlyArray<MaterialCollectionItem>,
  bomMap: ServiceBomMap,
): RawMaterialLine[] {
  const raw: RawMaterialLine[] = [];
  const coveredProductIds = new Set<string>();

  for (const item of items) {
    if ((item.kind === 'product' || item.kind === 'material') && item.productId) {
      coveredProductIds.add(item.productId);
    }
  }

  for (const item of items) {
    const lineQty = decimalQty(item.quantity);

    if ((item.kind === 'product' || item.kind === 'material') && item.productId && item.product) {
      raw.push({
        productId: item.product.id,
        productName: item.product.name,
        productCategory: item.product.category,
        unitOfMeasure: item.product.unitOfMeasure,
        quantity: lineQty,
        source: 'product_line',
        isOptional: false,
        isBillable: item.isBillable,
        serviceName: null,
        notes: item.notes,
        estimateItemId: item.lineId,
        serviceId: null,
      });
      continue;
    }

    if ((item.kind === 'service' || item.serviceId) && item.serviceId) {
      const serviceName = item.serviceName ?? item.description ?? 'Service';
      for (const bom of bomMap.get(item.serviceId) ?? []) {
        if (coveredProductIds.has(bom.product.id)) continue;
        raw.push({
          productId: bom.product.id,
          productName: bom.product.name,
          productCategory: bom.product.category,
          unitOfMeasure: bom.product.unitOfMeasure,
          quantity: decimalQty(bom.defaultQuantity).mul(lineQty),
          source: 'bom',
          isOptional: bom.isOptional,
          isBillable: false,
          serviceName,
          notes: bom.notes,
          estimateItemId: item.lineId,
          serviceId: item.serviceId,
        });
      }
    }
  }

  return raw;
}

export type { RawMaterialLine, BomRow };
