import { Prisma } from '@prototype/db';

import { allocateNumber } from '@/src/lib/accounting/numbering';
import { prisma } from '@/src/lib/prisma';
import {
  parseScheduledDate,
  summarizeServices,
  workOrderLineItemData,
  workOrderLineItemFromEstimateItem,
} from '@/src/lib/operations/work-order-shared';
import type {
  WorkOrderCreateInput,
  WorkOrderUpdateInput,
} from '@/src/lib/validation/work-orders';

async function resolveContact(args: {
  contactId?: string | null;
  contactName?: string | null;
  organizationId?: string | null;
  customerName?: string | null;
}): Promise<{ contactId: string; customerName: string | null }> {
  if (args.contactId) {
    const contact = await prisma.contact.findUnique({
      where: { id: args.contactId },
      select: { id: true, name: true },
    });
    if (!contact) throw new Error('Contact not found.');
    return {
      contactId: contact.id,
      customerName: args.customerName?.trim() || contact.name,
    };
  }

  const name = args.contactName?.trim() || args.customerName?.trim();
  if (!name) throw new Error('A contact is required.');

  const contact = await prisma.contact.create({
    data: {
      name,
      organizationId: args.organizationId ?? null,
      type: 'customer',
      status: 'active',
    },
    select: { id: true, name: true },
  });

  return { contactId: contact.id, customerName: contact.name };
}

export type WorkOrderLineItemDetail = {
  id: string;
  serviceId: string | null;
  serviceName: string | null;
  description: string;
  quantity: string;
  status: string;
  notes: string | null;
  sortOrder: number;
};

export type WorkOrderDetail = {
  id: string;
  workOrderNumber: string;
  status: string;
  contactId: string;
  customerName: string | null;
  estimateId: string | null;
  scheduledDate: string | null;
  specialInstructions: string | null;
  notes: string | null;
  lineItems: WorkOrderLineItemDetail[];
};

export async function createWorkOrder(input: WorkOrderCreateInput): Promise<WorkOrderDetail> {
  const serviceIds = input.lineItems.map((line) => line.serviceId).filter(Boolean) as string[];
  const services =
    serviceIds.length > 0
      ? await prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true },
        })
      : [];
  const serviceNames = new Map(services.map((service) => [service.id, service.name]));
  const summary = summarizeServices(input.lineItems, serviceNames);
  const contact = await resolveContact(input);

  const created = await prisma.$transaction(async (tx) => {
    const workOrderNumber = await allocateNumber('work-order', tx);
    const workOrder = await tx.workOrder.create({
      data: {
        workOrderNumber,
        contactId: contact.contactId,
        customerName: contact.customerName,
        estimateId: input.estimateId ?? null,
        serviceId: summary.serviceId,
        serviceName: summary.serviceName,
        status: input.status ?? 'scheduled',
        scheduledDate: parseScheduledDate(input.scheduledDate),
        specialInstructions: input.specialInstructions?.trim() || null,
        notes: input.notes?.trim() ? { summary: input.notes.trim() } : undefined,
      },
    });

    await tx.workOrderItem.createManyAndReturn({
      data: input.lineItems.map((line, index) => workOrderLineItemData(workOrder.id, line, index)),
    });

    return workOrder;
  });

  const detail = await getWorkOrderDetail(created.id);
  if (!detail) throw new Error('Work order was created but could not be loaded.');
  return detail;
}

export async function updateWorkOrder(
  id: string,
  input: WorkOrderUpdateInput,
): Promise<WorkOrderDetail> {
  const existing = await prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new Error('Work order not found.');

  const lineItems = input.lineItems;
  let summary: { serviceId: string | null; serviceName: string | null } | undefined;
  if (lineItems) {
    const serviceIds = lineItems.map((line) => line.serviceId).filter(Boolean) as string[];
    const services =
      serviceIds.length > 0
        ? await prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: { id: true, name: true },
          })
        : [];
    const serviceNames = new Map(services.map((service) => [service.id, service.name]));
    summary = summarizeServices(lineItems, serviceNames);
  }

  let contactPatch: { contactId?: string; customerName?: string | null } = {};
  if (input.contactId !== undefined || input.contactName !== undefined || input.customerName !== undefined) {
    const resolved = await resolveContact({
      contactId: input.contactId,
      contactName: input.contactName,
      organizationId: input.organizationId,
      customerName: input.customerName,
    });
    contactPatch = { contactId: resolved.contactId, customerName: resolved.customerName };
  }

  await prisma.$transaction(async (tx) => {
    await tx.workOrder.update({
      where: { id },
      data: {
        ...contactPatch,
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.estimateId !== undefined ? { estimateId: input.estimateId } : {}),
        ...(input.scheduledDate !== undefined
          ? { scheduledDate: parseScheduledDate(input.scheduledDate) }
          : {}),
        ...(input.specialInstructions !== undefined
          ? { specialInstructions: input.specialInstructions?.trim() || null }
          : {}),
        ...(input.notes !== undefined
          ? { notes: input.notes?.trim() ? { summary: input.notes.trim() } : Prisma.DbNull }
          : {}),
        ...(summary
          ? { serviceId: summary.serviceId, serviceName: summary.serviceName }
          : {}),
      },
    });

    if (lineItems) {
      await tx.workOrderItem.deleteMany({ where: { workOrderId: id } });
      await tx.workOrderItem.createManyAndReturn({
        data: lineItems.map((line, index) => workOrderLineItemData(id, line, index)),
      });
    }
  });

  const detail = await getWorkOrderDetail(id);
  if (!detail) throw new Error('Work order not found.');
  return detail;
}

export async function getWorkOrderDetail(id: string): Promise<WorkOrderDetail | null> {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      workOrderItems: {
        orderBy: [{ sortOrder: 'asc' }],
        include: { service: { select: { name: true } } },
      },
    },
  });
  if (!workOrder) return null;

  const notesPayload = workOrder.notes as { summary?: string | null } | null;

  return {
    id: workOrder.id,
    workOrderNumber: workOrder.workOrderNumber,
    status: workOrder.status,
    contactId: workOrder.contactId,
    customerName: workOrder.customerName,
    estimateId: workOrder.estimateId,
    scheduledDate: workOrder.scheduledDate
      ? workOrder.scheduledDate.toISOString().slice(0, 10)
      : null,
    specialInstructions: workOrder.specialInstructions,
    notes: notesPayload?.summary ?? null,
    lineItems: workOrder.workOrderItems.map((item) => ({
      id: item.id,
      serviceId: item.serviceId,
      serviceName: item.service?.name ?? null,
      description: item.description ?? '',
      quantity: item.quantity.toString(),
      status: item.status,
      notes: item.notes,
      sortOrder: item.sortOrder,
    })),
  };
}
