import type { Prisma } from '@prototype/db';

import { prisma } from '@/src/lib/prisma';

export const BANK_SYNC_AUDIT_MAX_LIMIT = 100;

export type BankSyncAuditEntry = {
  id: string;
  provider: string;
  operation: string;
  targetResourceId: string | null;
  responseStatus: number | null;
  durationMs: number | null;
  succeeded: boolean;
  errorMessage: string | null;
  createdAt: string;
};

export async function listBankSyncAuditLogs(params: {
  limit?: number;
  cursor?: string;
  succeeded?: boolean;
  operation?: string;
}): Promise<{ items: BankSyncAuditEntry[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(params.limit ?? BANK_SYNC_AUDIT_MAX_LIMIT, 1), BANK_SYNC_AUDIT_MAX_LIMIT);
  const where: Prisma.BankSyncAuditLogWhereInput = {};

  if (params.succeeded !== undefined) {
    where.succeeded = params.succeeded;
  }
  if (params.operation?.trim()) {
    where.operation = params.operation.trim();
  }

  const take = limit + 1;
  const rows = await prisma.bankSyncAuditLog.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take,
    ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
  });

  const hasMore = rows.length > limit;
  const sliced = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: sliced.map((row) => ({
      id: row.id,
      provider: row.provider,
      operation: row.operation,
      targetResourceId: row.targetResourceId,
      responseStatus: row.responseStatus,
      durationMs: row.durationMs,
      succeeded: row.succeeded,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt.toISOString(),
    })),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null,
  };
}

export async function listBankSyncOperations(): Promise<string[]> {
  const rows = await prisma.bankSyncAuditLog.findMany({
    distinct: ['operation'],
    select: { operation: true },
    orderBy: { operation: 'asc' },
  });
  return rows.map((row) => row.operation);
}
