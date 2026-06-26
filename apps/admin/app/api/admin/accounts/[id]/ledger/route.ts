import { NextResponse } from 'next/server';

import { getAccountLedger } from '@/src/lib/accounting/journal-entries';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { accountLedgerQuerySchema } from '@/src/lib/validation/journal-entry';

type RouteParams = { id: string };

export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const parsed = accountLedgerQuerySchema.parse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    const payload = await getAccountLedger(id, parsed);
    if (!payload) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
