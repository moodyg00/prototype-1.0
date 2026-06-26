import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  InvoiceServiceError,
  invoiceServiceErrorStatus,
  deleteInvoiceDraft,
  updateInvoiceDraft,
} from '@/src/lib/billing/invoice-service';
import { invoiceUpdateInputSchema } from '@/src/lib/validation/billing-document';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = invoiceUpdateInputSchema.parse(body);
    const invoice = await updateInvoiceDraft(id, parsed);
    return NextResponse.json({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      invoice,
    });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      return NextResponse.json(
        { error: error.message, details: { code: error.code } },
        { status: invoiceServiceErrorStatus(error.code) },
      );
    }
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await deleteInvoiceDraft(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvoiceServiceError) {
      return NextResponse.json(
        { error: error.message, details: { code: error.code } },
        { status: invoiceServiceErrorStatus(error.code) },
      );
    }
    return handleRouteError(error);
  }
}
