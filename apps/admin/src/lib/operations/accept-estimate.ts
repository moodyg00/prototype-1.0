import 'server-only';

import { Prisma } from '@prototype/db';

import { allocateNumber } from '@/src/lib/accounting/numbering';
import { prisma } from '@/src/lib/prisma';
import {
  buildSnapshotRowsFromManifest,
  resolveStockStatus,
  type EstimateMaterialRow,
} from '@/src/lib/operations/estimate-materials';
import {
  summarizeServices,
  workOrderLineItemFromEstimateItem,
} from '@/src/lib/operations/work-order-shared';

export type AcceptEstimateErrorCode =
  | 'not_found'
  | 'invalid_state'
  | 'missing_contact'
  | 'no_service_lines';

export class AcceptEstimateError extends Error {
  readonly code: AcceptEstimateErrorCode;
  constructor(code: AcceptEstimateErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'AcceptEstimateError';
  }
}

export function acceptEstimateErrorStatus(code: AcceptEstimateErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'invalid_state':
    case 'missing_contact':
    case 'no_service_lines':
    default:
      return 409;
  }
}

const ACCEPTABLE_STATUSES = new Set(['draft', 'sent', 'viewed']);

export type AcceptEstimateResult = {
  estimateId: string;
  workOrderId: string;
  workOrderNumber: string;
  materialCount: number;
};

export async function acceptEstimateAndCreateWorkOrder(
  estimateId: string,
): Promise<AcceptEstimateResult> {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    include: {
      estimateItems: {
        orderBy: [{ sortOrder: 'asc' }],
        include: { service: { select: { id: true, name: true } } },
      },
    },
  });

  if (!estimate) {
    throw new AcceptEstimateError('not_found', 'Estimate not found.');
  }
  if (estimate.convertedWorkOrderId) {
    throw new AcceptEstimateError(
      'invalid_state',
      'This estimate already has a linked work order.',
    );
  }
  if (!ACCEPTABLE_STATUSES.has(estimate.status)) {
    throw new AcceptEstimateError(
      'invalid_state',
      `Cannot accept an estimate with status "${estimate.status}".`,
    );
  }
  if (!estimate.contactId) {
    throw new AcceptEstimateError(
      'missing_contact',
      'Assign a contact before accepting this estimate.',
    );
  }

  const serviceLines = estimate.estimateItems.filter((item) => item.kind === 'service');
  if (serviceLines.length === 0) {
    throw new AcceptEstimateError(
      'no_service_lines',
      'Add at least one service line before accepting.',
    );
  }

  const snapshotRows = await buildSnapshotRowsFromManifest(estimateId);
  const summary = summarizeServices(
    serviceLines.map((item) => ({
      serviceId: item.serviceId,
      description: item.description,
      serviceName: item.service?.name ?? null,
    })),
  );

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const workOrderNumber = await allocateNumber('work-order', tx);
    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        contactId: estimate.contactId!,
        customerName: estimate.contactName,
        estimateId: estimate.id,
        serviceId: summary.serviceId,
        serviceName: summary.serviceName,
        status: 'new',
        notes: estimate.notes ? (estimate.notes as Prisma.InputJsonValue) : undefined,
      },
      select: { id: true, workOrderNumber: true },
    });

    await tx.workOrderItem.createManyAndReturn({
      data: serviceLines.map((item, index) =>
        workOrderLineItemFromEstimateItem({
          workOrderId: workOrder.id,
          serviceId: item.serviceId,
          description: item.service?.name ?? item.description?.trim() ?? 'Service',
          quantity: item.quantity,
          notes: item.notes,
          sortOrder: index,
        }),
      ),
    });

    if (snapshotRows.length > 0) {
      await tx.estimateMaterial.createManyAndReturn({
        data: snapshotRows.map((row) => ({
          estimateId: estimate.id,
          productId: row.productId,
          productName: row.productName,
          quantity: row.quantity,
          unitOfMeasure: row.unitOfMeasure,
          source: row.source,
          isOptional: row.isOptional,
          estimateItemId: row.estimateItemId,
          serviceId: row.serviceId,
          serviceName: row.serviceName,
          notes: row.notes,
        })),
      });

      await tx.workOrderMaterial.createManyAndReturn({
        data: snapshotRows.map((row) => ({
          workOrderId: workOrder.id,
          productId: row.productId,
          productName: row.productName,
          quantity: row.quantity,
          estimateItemId: row.estimateItemId,
          source: row.source === 'bom' ? 'bom' : 'estimate',
          isBillable: row.isBillable,
          notes: row.notes,
        })),
      });
    }

    await tx.estimate.update({
      where: { id: estimate.id },
      data: {
        status: 'accepted',
        acceptedAt: now,
        convertedAt: now,
        convertedWorkOrderId: workOrder.id,
      },
    });

    return {
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.workOrderNumber,
      materialCount: snapshotRows.length,
    };
  });

  return {
    estimateId: estimate.id,
    ...result,
  };
}

export type WorkOrderMaterialDetail = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: string;
  source: string;
  isBillable: boolean;
  notes: string | null;
  quantityOnHand: string | null;
  unitOfMeasure: string | null;
  purchaseUrl: string | null;
  stockStatus: EstimateMaterialRow['stockStatus'];
};

export async function getWorkOrderMaterials(
  workOrderId: string,
): Promise<WorkOrderMaterialDetail[]> {
  const materials = await prisma.workOrderMaterial.findMany({
    where: { workOrderId },
    orderBy: [{ productName: 'asc' }],
  });

  const productIds = materials.map((m) => m.productId).filter(Boolean) as string[];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            unitOfMeasure: true,
            purchaseUrl: true,
            inventorys: { take: 1, select: { quantityOnHand: true, reorderLevel: true } },
            productVendorLinks: {
              where: { isPreferred: true },
              orderBy: [{ sortOrder: 'asc' }],
              take: 1,
              select: { purchaseUrl: true },
            },
          },
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  return materials.map((row) => {
    const product = row.productId ? productMap.get(row.productId) : undefined;
    const onHand = product?.inventorys[0]?.quantityOnHand ?? null;
    const reorder = product?.inventorys[0]?.reorderLevel ?? null;
    const needed =
      row.quantity instanceof Prisma.Decimal ? row.quantity : new Prisma.Decimal(row.quantity);
    return {
      id: row.id,
      productId: row.productId,
      productName: row.productName ?? 'Material',
      quantity: needed.toString(),
      source: row.source,
      isBillable: row.isBillable,
      notes: row.notes,
      quantityOnHand: onHand?.toString() ?? null,
      unitOfMeasure: product?.unitOfMeasure ?? null,
      purchaseUrl:
        product?.purchaseUrl ?? product?.productVendorLinks[0]?.purchaseUrl ?? null,
      stockStatus: resolveStockStatus(needed, onHand, reorder),
    };
  });
}
