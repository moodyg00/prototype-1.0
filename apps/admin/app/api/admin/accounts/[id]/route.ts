import { NextResponse } from 'next/server';

import { getAccountSummary } from '@/src/lib/accounting/journal-entries';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    const account = await getAccountSummary(id);
    if (!account) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
    return NextResponse.json({ account });
  } catch (error) {
    return handleRouteError(error);
  }
}
