import { NextResponse } from 'next/server';

import { reverseJournalEntry } from '@/src/lib/accounting/journal-entries';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { journalEntryReverseSchema } from '@/src/lib/validation/journal-entry';

type RouteParams = { id: string };

export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id } = await params;
    let parsed: ReturnType<typeof journalEntryReverseSchema.parse> = {};
    if (request.headers.get('content-length') && Number(request.headers.get('content-length')) > 0) {
      const body = await readJsonBody<unknown>(request);
      parsed = journalEntryReverseSchema.parse(body ?? {});
    }
    const { original, reversal } = await reverseJournalEntry(id, {
      description: parsed.description ?? undefined,
      reversalDate: parsed.reversalDate,
    });
    return NextResponse.json({ original, reversal });
  } catch (error) {
    return handleRouteError(error);
  }
}
