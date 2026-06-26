import { NextResponse } from 'next/server';

import {
  deleteJournalEntry,
  getJournalEntryDetail,
  updateJournalEntry,
} from '@/src/lib/accounting/journal-entries';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { journalEntryUpdateSchema } from '@/src/lib/validation/journal-entry';

type RouteParams = { id: string };

export async function GET(_request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    const entry = await getJournalEntryDetail(id);
    if (!entry) {
      return NextResponse.json({ error: 'Journal entry not found.' }, { status: 404 });
    }
    return NextResponse.json({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    await deleteJournalEntry(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = journalEntryUpdateSchema.parse(body);
    const entry = await updateJournalEntry(id, parsed);
    return NextResponse.json({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}
