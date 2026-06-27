import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { syncMercuryBankDataIncremental } from '@prototype/accounting';
import { getCronSecret } from '@/src/lib/integrations/system-settings';

async function isAuthorized(request: Request): Promise<boolean> {
  const secret = await getCronSecret();
  if (!secret) return false;

  const header = request.headers.get('authorization');
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get('secret') === secret;
}

export async function GET(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await syncMercuryBankDataIncremental();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  return GET(request);
}
