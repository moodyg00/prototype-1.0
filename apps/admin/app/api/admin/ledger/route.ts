import { NextResponse } from 'next/server';

import { listGlobalLedger } from '@/src/lib/accounting/journal-entries';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { ledgerQuerySchema } from '@/src/lib/validation/journal-entry';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = ledgerQuerySchema.parse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      accountId: url.searchParams.get('accountId') ?? undefined,
      sourceModule: url.searchParams.get('sourceModule') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    const result = await listGlobalLedger(parsed);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
