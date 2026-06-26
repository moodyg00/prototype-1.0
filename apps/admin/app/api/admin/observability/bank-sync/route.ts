import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import {
  BANK_SYNC_AUDIT_MAX_LIMIT,
  listBankSyncAuditLogs,
  listBankSyncOperations,
} from '@/src/lib/observability/bank-sync-audit';

export const dynamic = 'force-dynamic';

function parseSucceeded(value: string | null): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) return BANK_SYNC_AUDIT_MAX_LIMIT;
  return Math.min(Math.max(parsed, 1), BANK_SYNC_AUDIT_MAX_LIMIT);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeOperations = url.searchParams.get('operations') === '1';

    const result = await listBankSyncAuditLogs({
      limit: parseLimit(url.searchParams.get('limit')),
      cursor: url.searchParams.get('cursor') ?? undefined,
      succeeded: parseSucceeded(url.searchParams.get('succeeded')),
      operation: url.searchParams.get('operation') ?? undefined,
    });

    const operations = includeOperations ? await listBankSyncOperations() : undefined;

    return NextResponse.json({
      ...result,
      ...(operations ? { operations } : {}),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
