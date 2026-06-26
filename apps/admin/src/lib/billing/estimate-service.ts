/**
 * Server-side persistence for the estimate flow.
 *
 * Allocates the canonical estimate number through the shared sequence module
 * (`numbering.allocateNumber('estimate', tx)`), computes Decimal totals from
 * the validated payload, and inserts the Estimate + its EstimateItem rows
 * inside a single transaction. Per the locked decision, we deliberately
 * never write to the legacy `Estimate.lineItems` JsonB column — only
 * `EstimateItem` rows, with `sortOrder = index`.
 *
 * Edit-mode patches drive `updateEstimateDraft` and `deleteEstimateDraft`.
 * Both refuse anything that is not a draft.
 */
import 'server-only';

import { Prisma } from '@prototype/db';

import { allocateNumber } from '@/src/lib/accounting/numbering';
import { computeDocumentTotals } from '@/src/lib/billing/compute-document-totals';
import {
  toAmountString,
  toDecimal,
} from '@/src/lib/accounting/money';
import { prisma } from '@/src/lib/prisma';
import type {
  EstimateCreateInput,
  EstimateUpdateInput,
  LineItemInput,
} from '@/src/lib/validation/billing-document';

export type EstimateServiceErrorCode =
  | 'not_found'
  | 'invalid_state'
  | 'invalid_input';

export class EstimateServiceError extends Error {
  readonly code: EstimateServiceErrorCode;
  constructor(code: EstimateServiceErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'EstimateServiceError';
  }
}

export function estimateServiceErrorStatus(code: EstimateServiceErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'invalid_state':
      return 409;
    case 'invalid_input':
    default:
      return 400;
  }
}

function parseDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new EstimateServiceError('invalid_input', `Invalid date: ${value}.`);
  }
  return parsed;
}

export type EstimateTotals = {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  itemTotals: string[];
};

export function computeEstimateTotals(input: {
  lineItems: ReadonlyArray<LineItemInput>;
  discountType: 'amount' | 'percent' | null | undefined;
  discountValue: string | undefined;
  taxRate: string | undefined;
}): EstimateTotals {
  return computeDocumentTotals(input);
}

function lineItemDataFor(line: LineItemInput, total: string, sortOrder: number) {
  const kind =
    line.serviceId && line.kind !== 'product' && line.kind !== 'material'
      ? 'service'
      : line.kind;
  return {
    kind,
    serviceId: kind === 'service' ? line.serviceId ?? null : null,
    productId:
      kind === 'product' || kind === 'material' ? line.productId ?? null : null,
    description: line.description ?? null,
    quantity: line.quantity ?? '1',
    unitPrice: line.unitPrice ?? '0',
    total,
    sortOrder,
    notes: line.notes ?? null,
    isBillable: line.isBillable !== false,
  };
}

function metadataPayload(input: {
  internalNotes?: string | null;
  issueDate?: string | null;
}) {
  const payload: Record<string, string> = {};
  if (input.internalNotes) payload.internalNotes = input.internalNotes;
  if (input.issueDate) payload.issueDate = input.issueDate;
  if (Object.keys(payload).length === 0) return Prisma.DbNull;
  return payload as Prisma.InputJsonValue;
}

export type CreatedEstimate = {
  id: string;
  estimateNumber: string;
  totalAmount: string;
};

export async function createEstimateDraft(
  input: EstimateCreateInput,
): Promise<CreatedEstimate> {
  const totals = computeEstimateTotals({
    lineItems: input.lineItems,
    discountType: input.discountType ?? null,
    discountValue: input.discountValue,
    taxRate: input.taxRate,
  });
  const issueDate = parseDate(input.issueDate);
  const validUntil = input.validUntil ? parseDate(input.validUntil) : null;
  if (validUntil && validUntil.getTime() < issueDate.getTime()) {
    throw new EstimateServiceError(
      'invalid_input',
      'Valid-until date must be on or after the issue date.',
    );
  }

  const estimate = await prisma.$transaction(async (tx) => {
    const estimateNumber = await allocateNumber('estimate', tx);
    const created = await tx.estimate.create({
      data: {
        estimateNumber,
        title: input.title,
        status: 'draft',
        contactId: input.contactId ?? null,
        contactName: input.contactName ?? null,
        organizationId: input.organizationId ?? null,
        organizationName: input.organizationName ?? null,
        estimateTemplateId: input.estimateTemplateId ?? null,
        validUntil: validUntil ?? null,
        paymentTerms: input.paymentTerms ?? null,
        // notes is JsonB in the Estimate model — keep it as a structured payload
        // so future iterations can store rich text without migrating again.
        notes: input.notes ? ({ body: input.notes } as Prisma.InputJsonValue) : Prisma.DbNull,
        metadata: metadataPayload({
          internalNotes: input.internalNotes ?? null,
          issueDate: input.issueDate,
        }),
        subtotal: totals.subtotal,
        discountType: input.discountType ?? null,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        // Locked decision: do NOT write to the legacy lineItems JsonB column.
        estimateItems: {
          create: input.lineItems.map((line, index) =>
            lineItemDataFor(line, totals.itemTotals[index] ?? '0', index),
          ),
        },
      },
      select: { id: true, estimateNumber: true, totalAmount: true },
    });
    return created;
  });

  return {
    id: estimate.id,
    estimateNumber: estimate.estimateNumber,
    totalAmount: estimate.totalAmount.toString(),
  };
}

export async function updateEstimateDraft(
  id: string,
  input: EstimateUpdateInput,
): Promise<CreatedEstimate> {
  const existing = await prisma.estimate.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new EstimateServiceError('not_found', 'Estimate not found.');
  }
  if (existing.status !== 'draft') {
    throw new EstimateServiceError(
      'invalid_state',
      `Only draft estimates can be edited (current status: ${existing.status}).`,
    );
  }

  const issueDate = input.issueDate ? parseDate(input.issueDate) : undefined;
  const validUntil =
    input.validUntil === null
      ? null
      : input.validUntil
        ? parseDate(input.validUntil)
        : undefined;

  const totals = input.lineItems
    ? computeEstimateTotals({
        lineItems: input.lineItems,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue,
        taxRate: input.taxRate,
      })
    : null;

  const updated = await prisma.$transaction(async (tx) => {
    if (input.lineItems) {
      await tx.estimateItem.deleteMany({ where: { estimateId: id } });
      await tx.estimateItem.createManyAndReturn({
        data: input.lineItems.map((line, index) => ({
          estimateId: id,
          ...lineItemDataFor(line, totals!.itemTotals[index] ?? '0', index),
        })),
      });
    }
    const estimate = await tx.estimate.update({
      where: { id },
      data: {
        ...(validUntil !== undefined ? { validUntil } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.contactId !== undefined ? { contactId: input.contactId } : {}),
        ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
        ...(input.organizationName !== undefined
          ? { organizationName: input.organizationName }
          : {}),
        ...(input.estimateTemplateId !== undefined
          ? { estimateTemplateId: input.estimateTemplateId }
          : {}),
        ...(input.paymentTerms !== undefined ? { paymentTerms: input.paymentTerms } : {}),
        ...(input.notes !== undefined
          ? {
              notes: input.notes
                ? ({ body: input.notes } as Prisma.InputJsonValue)
                : Prisma.DbNull,
            }
          : {}),
        ...(input.internalNotes !== undefined || input.issueDate !== undefined
          ? {
              metadata: metadataPayload({
                internalNotes: input.internalNotes ?? null,
                issueDate: input.issueDate ?? null,
              }),
            }
          : {}),
        ...(totals
          ? {
              subtotal: totals.subtotal,
              discountAmount: totals.discountAmount,
              taxAmount: totals.taxAmount,
              totalAmount: totals.totalAmount,
            }
          : {}),
        ...(input.discountType !== undefined ? { discountType: input.discountType } : {}),
      },
      select: { id: true, estimateNumber: true, totalAmount: true },
    });
    return estimate;
  });

  return {
    id: updated.id,
    estimateNumber: updated.estimateNumber,
    totalAmount: updated.totalAmount.toString(),
  };
}

export async function deleteEstimateDraft(id: string): Promise<void> {
  const existing = await prisma.estimate.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new EstimateServiceError('not_found', 'Estimate not found.');
  }
  if (existing.status !== 'draft') {
    throw new EstimateServiceError(
      'invalid_state',
      `Only draft estimates can be deleted (current status: ${existing.status}).`,
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.estimateItem.deleteMany({ where: { estimateId: id } });
    await tx.estimate.delete({ where: { id } });
  });
}

export type EstimateDetail = {
  id: string;
  estimateNumber: string;
  status: string;
  title: string;
  issueDate: string;
  validUntil: string | null;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  estimateTemplateId: string | null;
  paymentTerms: string | null;
  notes: string | null;
  internalNotes: string | null;
  subtotal: string;
  discountType: 'amount' | 'percent' | null;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  convertedWorkOrderId: string | null;
  lineItems: Array<{
    id: string;
    kind: 'service' | 'product' | 'material' | 'custom';
    serviceId: string | null;
    productId: string | null;
    description: string | null;
    quantity: string;
    unitPrice: string;
    total: string;
    sortOrder: number;
    notes: string | null;
    isBillable: boolean;
  }>;
};

export async function getEstimateDetail(id: string): Promise<EstimateDetail | null> {
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      contact: { select: { email: true } },
      estimateItems: { orderBy: [{ sortOrder: 'asc' }] },
    },
  });
  if (!estimate) return null;
  const metadata = estimate.metadata as {
    internalNotes?: string | null;
    issueDate?: string | null;
  } | null;
  const notesPayload = estimate.notes as { body?: string | null } | null;
  return {
    id: estimate.id,
    estimateNumber: estimate.estimateNumber,
    status: estimate.status,
    title: estimate.title,
    issueDate:
      metadata?.issueDate ??
      (estimate.createdAt ?? new Date()).toISOString().slice(0, 10),
    validUntil: estimate.validUntil ? estimate.validUntil.toISOString().slice(0, 10) : null,
    contactId: estimate.contactId,
    contactName: estimate.contactName,
    contactEmail: estimate.contact?.email ?? null,
    organizationId: estimate.organizationId,
    organizationName: estimate.organizationName,
    estimateTemplateId: estimate.estimateTemplateId,
    paymentTerms: estimate.paymentTerms,
    notes: notesPayload?.body ?? null,
    internalNotes: metadata?.internalNotes ?? null,
    subtotal: (estimate.subtotal ?? new Prisma.Decimal(0)).toString(),
    discountType: (estimate.discountType as 'amount' | 'percent' | null) ?? null,
    discountAmount: estimate.discountAmount.toString(),
    taxAmount: (estimate.taxAmount ?? new Prisma.Decimal(0)).toString(),
    totalAmount: estimate.totalAmount.toString(),
    convertedWorkOrderId: estimate.convertedWorkOrderId,
    lineItems: estimate.estimateItems.map((item, index) => ({
      id: item.id,
      kind: (item.kind as 'service' | 'product' | 'material' | 'custom') ?? 'custom',
      serviceId: item.serviceId,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
      sortOrder: item.sortOrder ?? index,
      notes: item.notes,
      isBillable: item.isBillable,
    })),
  };
}
