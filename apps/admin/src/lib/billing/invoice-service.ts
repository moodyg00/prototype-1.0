/**
 * Server-side persistence for the invoice flow.
 *
 * Allocates the canonical invoice number through the shared sequence module
 * (`numbering.allocateNumber('invoice', tx)`), computes Decimal totals from
 * the validated payload, and inserts the Invoice + its InvoiceItem rows
 * inside a single transaction. Drafts are persisted with `status='draft'`;
 * we deliberately do NOT auto-post a JournalEntry — that decision moves to
 * the post-invoice action defined in a future slice.
 *
 * Edit-mode patches drive `updateInvoiceDraft` and `deleteInvoiceDraft`.
 * Both refuse anything that is not a draft so accounting integrity stays
 * intact once the document is sent.
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
  InvoiceCreateInput,
  InvoiceUpdateInput,
  LineItemInput,
} from '@/src/lib/validation/billing-document';
import { inferLineItemKind } from '@/src/lib/billing/line-item-kinds';

export type InvoiceServiceErrorCode =
  | 'not_found'
  | 'invalid_state'
  | 'invalid_input';

export class InvoiceServiceError extends Error {
  readonly code: InvoiceServiceErrorCode;
  constructor(code: InvoiceServiceErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'InvoiceServiceError';
  }
}

export function invoiceServiceErrorStatus(code: InvoiceServiceErrorCode): number {
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
    throw new InvoiceServiceError('invalid_input', `Invalid date: ${value}.`);
  }
  return parsed;
}

export type InvoiceTotals = {
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  itemTotals: string[];
};

export function computeInvoiceTotals(input: {
  lineItems: ReadonlyArray<LineItemInput>;
  discountType: 'amount' | 'percent' | null | undefined;
  discountValue: string | undefined;
  taxRate: string | undefined;
}): InvoiceTotals {
  return computeDocumentTotals(input);
}

function lineItemDataFor(line: LineItemInput, total: string, position: number) {
  return {
    serviceId: line.kind === 'service' ? line.serviceId ?? null : null,
    productId:
      line.kind === 'product' || line.kind === 'material' ? line.productId ?? null : null,
    description: line.description ?? null,
    quantity: line.quantity ?? '1',
    unitPrice: line.unitPrice ?? '0',
    total,
    position,
    isBillable: line.isBillable !== false,
  };
}

function metadataPayload(input: { internalNotes?: string | null }) {
  if (!input.internalNotes) return Prisma.DbNull;
  return { internalNotes: input.internalNotes } as Prisma.InputJsonValue;
}

function contactRelation(input: { contactId?: string | null }) {
  if (input.contactId) {
    return { contact: { connect: { id: input.contactId } } };
  }
  return {};
}

function organizationRelation(input: { organizationId?: string | null }) {
  if (input.organizationId) {
    return { organization: { connect: { id: input.organizationId } } };
  }
  return {};
}

function contactRelationUpdate(contactId: string | null | undefined) {
  if (contactId === undefined) return {};
  if (contactId) {
    return { contact: { connect: { id: contactId } } };
  }
  return { contact: { disconnect: true } };
}

function organizationRelationUpdate(organizationId: string | null | undefined) {
  if (organizationId === undefined) return {};
  if (organizationId) {
    return { organization: { connect: { id: organizationId } } };
  }
  return { organization: { disconnect: true } };
}

export type CreatedInvoice = {
  id: string;
  invoiceNumber: string;
  totalAmount: string;
};

export async function createInvoiceDraft(
  input: InvoiceCreateInput,
): Promise<CreatedInvoice> {
  const totals = computeInvoiceTotals({
    lineItems: input.lineItems,
    discountType: input.discountType ?? null,
    discountValue: input.discountValue,
    taxRate: input.taxRate,
  });
  const issueDate = parseDate(input.issueDate);
  const dueDate = parseDate(input.dueDate);
  if (dueDate.getTime() < issueDate.getTime()) {
    throw new InvoiceServiceError('invalid_input', 'Due date must be on or after the issue date.');
  }

  const invoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await allocateNumber('invoice', tx);
    const created = await tx.invoice.create({
      data: {
        invoiceNumber,
        issueDate,
        dueDate,
        status: 'draft',
        contactName: input.contactName ?? null,
        organizationName: input.organizationName ?? null,
        ...contactRelation(input),
        ...organizationRelation(input),
        paymentTerms: input.paymentTerms ?? null,
        notes: input.notes ?? null,
        metadata: metadataPayload({ internalNotes: input.internalNotes ?? null }),
        subtotal: totals.subtotal,
        discountType: input.discountType ?? null,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        amountPaid: '0',
        amountDue: totals.totalAmount,
        invoiceItems: {
          create: input.lineItems.map((line, index) =>
            lineItemDataFor(line, totals.itemTotals[index] ?? '0', index),
          ),
        },
      },
      select: { id: true, invoiceNumber: true, totalAmount: true },
    });
    return created;
  });

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    totalAmount: invoice.totalAmount.toString(),
  };
}

export async function updateInvoiceDraft(
  id: string,
  input: InvoiceUpdateInput,
): Promise<CreatedInvoice> {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true, invoiceItems: { select: { id: true } } },
  });
  if (!existing) {
    throw new InvoiceServiceError('not_found', 'Invoice not found.');
  }
  if (existing.status !== 'draft') {
    throw new InvoiceServiceError(
      'invalid_state',
      `Only draft invoices can be edited (current status: ${existing.status}).`,
    );
  }

  const issueDate = input.issueDate ? parseDate(input.issueDate) : undefined;
  const dueDate = input.dueDate ? parseDate(input.dueDate) : undefined;
  if (issueDate && dueDate && dueDate.getTime() < issueDate.getTime()) {
    throw new InvoiceServiceError('invalid_input', 'Due date must be on or after the issue date.');
  }

  const totals = input.lineItems
    ? computeInvoiceTotals({
        lineItems: input.lineItems,
        discountType: input.discountType ?? null,
        discountValue: input.discountValue,
        taxRate: input.taxRate,
      })
    : null;

  const updated = await prisma.$transaction(async (tx) => {
    if (input.lineItems) {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.createManyAndReturn({
        data: input.lineItems.map((line, index) => ({
          invoiceId: id,
          ...lineItemDataFor(line, totals!.itemTotals[index] ?? '0', index),
        })),
      });
    }
    const invoice = await tx.invoice.update({
      where: { id },
      data: {
        ...(issueDate ? { issueDate } : {}),
        ...(dueDate ? { dueDate } : {}),
        ...contactRelationUpdate(input.contactId),
        ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
        ...organizationRelationUpdate(input.organizationId),
        ...(input.organizationName !== undefined
          ? { organizationName: input.organizationName }
          : {}),
        ...(input.paymentTerms !== undefined ? { paymentTerms: input.paymentTerms } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.internalNotes !== undefined
          ? { metadata: metadataPayload({ internalNotes: input.internalNotes }) }
          : {}),
        ...(totals
          ? {
              subtotal: totals.subtotal,
              discountAmount: totals.discountAmount,
              taxAmount: totals.taxAmount,
              totalAmount: totals.totalAmount,
              amountDue: totals.totalAmount,
            }
          : {}),
        ...(input.discountType !== undefined ? { discountType: input.discountType } : {}),
      },
      select: { id: true, invoiceNumber: true, totalAmount: true },
    });
    return invoice;
  });

  return {
    id: updated.id,
    invoiceNumber: updated.invoiceNumber,
    totalAmount: updated.totalAmount.toString(),
  };
}

export async function deleteInvoiceDraft(id: string): Promise<void> {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new InvoiceServiceError('not_found', 'Invoice not found.');
  }
  if (existing.status !== 'draft') {
    throw new InvoiceServiceError(
      'invalid_state',
      `Only draft invoices can be deleted (current status: ${existing.status}).`,
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await tx.invoice.delete({ where: { id } });
  });
}

export type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  contactId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  paymentTerms: string | null;
  notes: string | null;
  internalNotes: string | null;
  subtotal: string;
  discountType: 'amount' | 'percent' | null;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  lineItems: Array<{
    id: string;
    kind: 'service' | 'product' | 'material' | 'custom';
    serviceId: string | null;
    productId: string | null;
    description: string | null;
    quantity: string;
    unitPrice: string;
    total: string;
    position: number;
    isBillable: boolean;
  }>;
};

export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      contact: { select: { email: true } },
      invoiceItems: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: { select: { category: true, isInternalUse: true } },
        },
      },
    },
  });
  if (!invoice) return null;
  const metadata = invoice.metadata as { internalNotes?: string | null } | null;
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString().slice(0, 10),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
    contactId: invoice.contactId,
    contactName: invoice.contactName,
    contactEmail: invoice.contact?.email ?? null,
    organizationId: invoice.organizationId,
    organizationName: invoice.organizationName,
    paymentTerms: invoice.paymentTerms,
    notes: invoice.notes,
    internalNotes: metadata?.internalNotes ?? null,
    subtotal: invoice.subtotal.toString(),
    discountType: (invoice.discountType as 'amount' | 'percent' | null) ?? null,
    discountAmount: invoice.discountAmount.toString(),
    taxAmount: invoice.taxAmount.toString(),
    totalAmount: invoice.totalAmount.toString(),
    lineItems: invoice.invoiceItems.map((item, index) => ({
      id: item.id,
      kind: inferLineItemKind({
        serviceId: item.serviceId,
        productId: item.productId,
        productCategory: item.product?.category ?? null,
        productIsInternalUse: item.product?.isInternalUse ?? null,
      }),
      serviceId: item.serviceId,
      productId: item.productId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      total: item.total.toString(),
      position: item.position ?? index,
      isBillable: item.isBillable,
    })),
  };
}
