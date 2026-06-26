import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { bootstrapIntegrationsFromEnv } from '@/src/lib/integrations/bootstrap-from-env';

export async function POST() {
  try {
    const result = await bootstrapIntegrationsFromEnv();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleRouteError(error);
  }
}
