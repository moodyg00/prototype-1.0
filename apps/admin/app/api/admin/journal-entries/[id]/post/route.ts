import { NextResponse } from 'next/server';

import { postJournalEntry } from '@/src/lib/accounting/journal-entries';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

type RouteParams = { id: string };

export async function POST(_request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    const entry = await postJournalEntry(id);
    return NextResponse.json({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}
