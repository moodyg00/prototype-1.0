import { Prisma } from '@prototype/db';

import type { WorkOrderLineItemInput } from '@/src/lib/validation/work-orders';

export function parseScheduledDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function summarizeServices(
  lineItems: Array<{
    serviceId?: string | null;
    description?: string | null;
    serviceName?: string | null;
  }>,
  serviceNames?: Map<string, string>,
): { serviceId: string | null; serviceName: string | null } {
  const firstServiceId = lineItems.find((line) => line.serviceId)?.serviceId ?? null;
  const names = lineItems
    .map((line) => {
      if (line.serviceId && serviceNames?.has(line.serviceId)) {
        return serviceNames.get(line.serviceId)!;
      }
      return line.serviceName ?? line.description?.trim() ?? '';
    })
    .filter(Boolean);
  const unique = [...new Set(names)];
  return {
    serviceId: firstServiceId,
    serviceName: unique.length > 0 ? unique.join(', ') : null,
  };
}

export function workOrderLineItemData(
  workOrderId: string,
  line: WorkOrderLineItemInput,
  sortOrder: number,
): Prisma.WorkOrderItemCreateManyInput {
  const qty = Number(line.quantity);
  return {
    workOrderId,
    serviceId: line.serviceId ?? null,
    description: line.description.trim(),
    quantity: Number.isFinite(qty) ? qty : 1,
    unitPrice: 0,
    total: 0,
    sortOrder,
    notes: line.notes?.trim() || null,
    status: 'pending',
  };
}

export function workOrderLineItemFromEstimateItem(args: {
  workOrderId: string;
  serviceId: string | null;
  description: string;
  quantity: Prisma.Decimal | number | string;
  notes: string | null;
  sortOrder: number;
}): Prisma.WorkOrderItemCreateManyInput {
  const qty =
    args.quantity instanceof Prisma.Decimal
      ? args.quantity.toNumber()
      : Number(args.quantity);
  return {
    workOrderId: args.workOrderId,
    serviceId: args.serviceId,
    description: args.description,
    quantity: Number.isFinite(qty) ? qty : 1,
    unitPrice: 0,
    total: 0,
    sortOrder: args.sortOrder,
    notes: args.notes,
    status: 'pending',
  };
}
