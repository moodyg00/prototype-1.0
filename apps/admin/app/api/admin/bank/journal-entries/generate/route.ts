import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { generateJournalEntriesFromBankTransactions } from '@prototype/accounting';

export async function POST() {
  try {
    const result = await generateJournalEntriesFromBankTransactions();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleRouteError(error);
  }
}
