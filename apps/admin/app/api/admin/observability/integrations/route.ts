import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { INTEGRATION_LOG_MAX_LIMIT, listIntegrationLogs } from '@/src/lib/observability/integration-logs';

export const dynamic = 'force-dynamic';

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return INTEGRATION_LOG_MAX_LIMIT;
  return Math.min(Math.max(parsed, 1), INTEGRATION_LOG_MAX_LIMIT);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const result = await listIntegrationLogs({
      limit: parseLimit(url.searchParams.get('limit')),
      cursor: url.searchParams.get('cursor') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      logType: url.searchParams.get('logType') ?? undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
