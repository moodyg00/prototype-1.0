import { NextResponse } from 'next/server';

import { searchJournalReferenceOptions } from '@/src/lib/accounting/journal-reference-search';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    const options = await searchJournalReferenceOptions(q);
    return NextResponse.json({ options });
  } catch (error) {
    return handleRouteError(error);
  }
}
