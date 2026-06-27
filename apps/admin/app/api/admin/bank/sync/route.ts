import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { syncMercuryBankData, syncMercuryBankDataIncremental } from '@prototype/accounting';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const full = url.searchParams.get('full') === 'true';
    const result = full
      ? await syncMercuryBankData({ removeDemoSeed: true })
      : await syncMercuryBankDataIncremental();
    return NextResponse.json({ ok: true, mode: full ? 'full' : 'incremental', ...result });
  } catch (error) {
    return handleRouteError(error);
  }
}
