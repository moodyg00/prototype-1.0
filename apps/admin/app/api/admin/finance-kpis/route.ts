import { NextResponse } from 'next/server';

import { getFinanceKpis } from '@/src/lib/accounting/finance-kpis';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') ?? undefined;
    const to = url.searchParams.get('to') ?? undefined;
    const kpis = await getFinanceKpis({ from, to });
    return NextResponse.json({ kpis });
  } catch (error) {
    return handleRouteError(error);
  }
}
