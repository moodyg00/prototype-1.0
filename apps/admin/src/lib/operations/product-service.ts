import 'server-only';

import { prisma } from '@/src/lib/prisma';
import type { ProductUpdateInput } from '@/src/lib/validation/products';

export type ProductDetail = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  sku: string | null;
  unitOfMeasure: string | null;
  unitPrice: string | null;
  purchaseUrl: string | null;
  isForSale: boolean;
  isInternalUse: boolean;
  quantityOnHand: string | null;
};

export async function getProductDetail(id: string): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      sku: true,
      unitOfMeasure: true,
      unitPrice: true,
      purchaseUrl: true,
      isForSale: true,
      isInternalUse: true,
      inventorys: { take: 1, select: { quantityOnHand: true } },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    sku: product.sku,
    unitOfMeasure: product.unitOfMeasure,
    unitPrice: product.unitPrice ? product.unitPrice.toString() : null,
    purchaseUrl: product.purchaseUrl,
    isForSale: product.isForSale,
    isInternalUse: product.isInternalUse,
    quantityOnHand: product.inventorys[0]?.quantityOnHand?.toString() ?? null,
  };
}

export async function updateProduct(id: string, input: ProductUpdateInput): Promise<ProductDetail> {
  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error('Catalog item not found.');

  await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      ...(input.unitOfMeasure !== undefined ? { unitOfMeasure: input.unitOfMeasure } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.purchaseUrl !== undefined ? { purchaseUrl: input.purchaseUrl } : {}),
      ...(input.isForSale !== undefined ? { isForSale: input.isForSale } : {}),
      ...(input.isInternalUse !== undefined ? { isInternalUse: input.isInternalUse } : {}),
    },
  });

  const detail = await getProductDetail(id);
  if (!detail) throw new Error('Catalog item not found.');
  return detail;
}
