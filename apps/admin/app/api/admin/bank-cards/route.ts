import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { listBankCards } from '@prototype/accounting';

export async function GET() {
  try {
    const items = await listBankCards();
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
