import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { previewNextNumber } from '@/src/lib/accounting/numbering';

export async function GET() {
  try {
    const invoiceNumber = await previewNextNumber('invoice');
    return NextResponse.json({ invoiceNumber });
  } catch (error) {
    return handleRouteError(error);
  }
}
