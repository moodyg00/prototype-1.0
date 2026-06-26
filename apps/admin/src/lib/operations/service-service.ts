import { prisma } from '@/src/lib/prisma';
import type { ServiceMaterialRowInput } from '@/src/lib/validation/service-materials';
import type { ServiceUpdateInput } from '@/src/lib/validation/services';

export type ServiceMaterialDetail = {
  id: string;
  productId: string;
  productName: string;
  productCategory: string;
  defaultQuantity: string;
  unitPrice: string | null;
  isOptional: boolean;
  notes: string | null;
  quantityOnHand: string | null;
  unitOfMeasure: string | null;
};

export type ServiceDetail = {
  id: string;
  name: string;
  description: string | null;
  quotePrompt: string | null;
  category: string;
  estimatedDurationMinutes: number | null;
  suggestedPrice: string | null;
  isActive: boolean;
  materials: ServiceMaterialDetail[];
};

export async function getServiceDetail(id: string): Promise<ServiceDetail | null> {
  const service = await prisma.service.findUnique({
    where: { id },
    include: {
      serviceMaterials: {
        orderBy: [{ createdAt: 'asc' }],
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
              unitPrice: true,
              unitOfMeasure: true,
              inventorys: { select: { quantityOnHand: true }, take: 1 },
            },
          },
        },
      },
    },
  });
  if (!service) return null;

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    quotePrompt: service.quotePrompt,
    category: service.category,
    estimatedDurationMinutes: service.estimatedDurationMinutes,
    suggestedPrice: service.suggestedPrice ? service.suggestedPrice.toString() : null,
    isActive: service.isActive,
    materials: service.serviceMaterials.map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.product.name,
      productCategory: row.product.category,
      defaultQuantity: row.defaultQuantity.toString(),
      unitPrice: row.product.unitPrice ? row.product.unitPrice.toString() : null,
      isOptional: row.isOptional,
      notes: row.notes,
      quantityOnHand:
        row.product.inventorys[0]?.quantityOnHand?.toString() ?? null,
      unitOfMeasure: row.product.unitOfMeasure,
    })),
  };
}

export async function replaceServiceMaterials(
  serviceId: string,
  materials: ServiceMaterialRowInput[],
): Promise<ServiceMaterialDetail[]> {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true },
  });
  if (!service) throw new Error('Service not found.');

  await prisma.$transaction(async (tx) => {
    await tx.serviceMaterial.deleteMany({ where: { serviceId } });
    if (materials.length > 0) {
      await tx.serviceMaterial.createManyAndReturn({
        data: materials.map((row) => ({
          serviceId,
          productId: row.productId,
          defaultQuantity: Number(row.defaultQuantity) || 1,
          isOptional: row.isOptional ?? false,
          notes: row.notes?.trim() || null,
        })),
      });
    }
  });

  const detail = await getServiceDetail(serviceId);
  return detail?.materials ?? [];
}

export async function updateService(
  id: string,
  patch: ServiceUpdateInput,
): Promise<ServiceDetail> {
  return updateServiceBasics(id, patch);
}

export async function updateServiceBasics(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    quotePrompt?: string | null;
    category?: string;
    estimatedDurationMinutes?: number | null;
    suggestedPrice?: string | null;
    isActive?: boolean;
  },
): Promise<ServiceDetail> {
  await prisma.service.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.quotePrompt !== undefined ? { quotePrompt: patch.quotePrompt } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.estimatedDurationMinutes !== undefined
        ? { estimatedDurationMinutes: patch.estimatedDurationMinutes }
        : {}),
      ...(patch.suggestedPrice !== undefined
        ? { suggestedPrice: patch.suggestedPrice }
        : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    },
  });

  const detail = await getServiceDetail(id);
  if (!detail) throw new Error('Service not found.');
  return detail;
}

export async function deleteService(id: string): Promise<void> {
  const existing = await prisma.service.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!existing) throw new Error('Offering not found.');

  await prisma.service.delete({ where: { id } });
}
