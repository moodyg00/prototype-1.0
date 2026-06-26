import type { Prisma } from '@prototype/db';

import { prisma } from '@/src/lib/prisma';

export const INTEGRATION_LOG_MAX_LIMIT = 100;

export type IntegrationLogEntry = {
  id: string;
  integrationId: string;
  integrationName: string;
  integrationProvider: string | null;
  logType: string;
  status: string;
  endpoint: string | null;
  requestPayload: Record<string, unknown> | null;
  responsePayload: Record<string, unknown> | null;
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string | null;
};

export async function listIntegrationLogs(params: {
  limit?: number;
  cursor?: string;
  status?: string;
  logType?: string;
}): Promise<{ items: IntegrationLogEntry[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(params.limit ?? INTEGRATION_LOG_MAX_LIMIT, 1), INTEGRATION_LOG_MAX_LIMIT);
  const where: Prisma.IntegrationLogWhereInput = {};

  if (params.status?.trim()) {
    where.status = params.status.trim();
  }
  if (params.logType?.trim()) {
    where.logType = params.logType.trim();
  }

  const take = limit + 1;
  const rows = await prisma.integrationLog.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      integration: {
        select: { name: true, provider: true },
      },
    },
    take,
    ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
  });

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: sliced.map((row) => ({
      id: row.id,
      integrationId: row.integrationId,
      integrationName: row.integration.name,
      integrationProvider: row.integration.provider,
      logType: row.logType,
      status: row.status,
      endpoint: row.endpoint,
      requestPayload: (row.requestPayload as Record<string, unknown> | null) ?? null,
      responsePayload: (row.responsePayload as Record<string, unknown> | null) ?? null,
      errorMessage: row.errorMessage,
      durationMs: row.durationMs,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    })),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null,
  };
}
