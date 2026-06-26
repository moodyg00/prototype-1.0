/**
 * Auto-create a WorkOrder from the most recent Estimate for a contact when a
 * booking is confirmed (product decision 6).
 *
 * Fallback: if the contact has no estimate, the work order is still created
 * without estimate linkage so confirmation never fails for that reason. If
 * there is no contact at all, no work order is created (WorkOrder.contactId is
 * required) and the caller is told via the returned `reason`.
 */
import type { Prisma } from '@prototype/db';

import { allocateOpaqueDocumentNumber } from '@/src/lib/accounting/numbering';
import {
  summarizeServices,
  workOrderLineItemFromEstimateItem,
} from '@/src/lib/operations/work-order-shared';

export interface WorkOrderResult {
  workOrderId: string | null;
  /** How the work order was (or wasn't) created — useful for surfacing notes. */
  reason: 'from_estimate' | 'from_link' | 'no_estimate_fallback' | 'no_contact_skipped';
}

/** Apply a confirmed booking's schedule to an existing work order. */
export async function applyConfirmedBookingToWorkOrder(
  tx: Prisma.TransactionClient,
  args: { workOrderId: string; bookingDate: Date },
): Promise<void> {
  await tx.workOrder.update({
    where: { id: args.workOrderId },
    data: {
      status: 'scheduled',
      scheduledDate: args.bookingDate,
      bookingDate: args.bookingDate,
    },
  });
}

export async function createWorkOrderFromLatestEstimate(
  tx: Prisma.TransactionClient,
  args: { contactId: string | null; serviceId: string | null },
): Promise<WorkOrderResult> {
  if (!args.contactId) {
    return { workOrderId: null, reason: 'no_contact_skipped' };
  }

  const estimate = await tx.estimate.findFirst({
    where: { contactId: args.contactId },
    orderBy: [{ createdAt: 'desc' }],
    select: {
      id: true,
      contactName: true,
      title: true,
      convertedInvoiceId: true,
      estimateItems: {
        where: { kind: 'service' },
        orderBy: [{ sortOrder: 'asc' }],
        select: {
          serviceId: true,
          description: true,
          quantity: true,
          notes: true,
        },
      },
    },
  });

  const lineItems =
    estimate?.estimateItems && estimate.estimateItems.length > 0
      ? estimate.estimateItems
      : args.serviceId
        ? [
            {
              serviceId: args.serviceId,
              description: null as string | null,
              quantity: 1,
              notes: null as string | null,
            },
          ]
        : [];

  const serviceIds = lineItems.map((line) => line.serviceId).filter(Boolean) as string[];
  const services =
    serviceIds.length > 0
      ? await tx.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];
  const serviceNames = new Map(services.map((service) => [service.id, service.name]));

  const summary = summarizeServices(lineItems, serviceNames);
  const firstServiceId = summary.serviceId ?? args.serviceId ?? null;

  const workOrderNumber = allocateOpaqueDocumentNumber();
  const workOrder = await tx.workOrder.create({
    data: {
      workOrderNumber,
      contactId: args.contactId,
      estimateId: estimate?.id ?? null,
      customerName: estimate?.contactName ?? null,
      serviceId: firstServiceId,
      serviceName: summary.serviceName,
      status: 'scheduled',
    },
    select: { id: true },
  });

  if (lineItems.length > 0) {
    await tx.workOrderItem.createManyAndReturn({
      data: lineItems.map((line, index) => {
        const description =
          (line.serviceId && serviceNames.get(line.serviceId)) ||
          line.description?.trim() ||
          'Service';
        return workOrderLineItemFromEstimateItem({
          workOrderId: workOrder.id,
          serviceId: line.serviceId ?? null,
          description,
          quantity: line.quantity,
          notes: line.notes?.trim() || null,
          sortOrder: index,
        });
      }),
    });
  }

  return {
    workOrderId: workOrder.id,
    reason: estimate ? 'from_estimate' : 'no_estimate_fallback',
  };
}
