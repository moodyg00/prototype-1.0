import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  InvoiceServiceError,
  invoiceServiceErrorStatus,
  createInvoiceDraft,
} from '@/src/lib/billing/invoice-service';
import { invoiceCreateInputSchema } from '@/src/lib/validation/billing-document';

export async function GET() {
  try {
    const { listAdminRecords } = await import('@/src/lib/admin-record-operations');
    const records = await listAdminRecords('invoices');
    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load records.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = invoiceCreateInputSchema.parse(body);
    const invoice = await createInvoiceDraft(parsed);
    return NextResponse.json(
      {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        invoice,
      },
      { status: 201 },
    );
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
