import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import {
  ensureDefaultBankRules,
  reprocessUnprocessedBankTransactions,
} from '@prototype/accounting';

export async function POST() {
  try {
    const ensured = await ensureDefaultBankRules();
    const result = await reprocessUnprocessedBankTransactions();
    return NextResponse.json({
      ok: true,
      ensured,
      ...result,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
