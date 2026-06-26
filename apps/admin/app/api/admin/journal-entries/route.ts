import { NextResponse } from 'next/server';

import {
  createJournalEntry,
  listJournalEntries,
} from '@/src/lib/accounting/journal-entries';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import {
  journalEntryCreateSchema,
  journalEntryListQuerySchema,
} from '@/src/lib/validation/journal-entry';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = journalEntryListQuerySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      cursor: url.searchParams.get('cursor') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });
    const result = await listJournalEntries(parsed);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = journalEntryCreateSchema.parse(body);
    const created = await createJournalEntry(parsed);
    return NextResponse.json({ entry: created }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
