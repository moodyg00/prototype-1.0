import { createHash } from 'crypto';

import type { Prisma } from '@prototype/db';
import type { MemoryScope, SourceKind } from '@prototype/memory';

import { prisma } from '../prisma';

export async function catalogMemoryChunks(
  records: Array<{
    id: string;
    text: string;
    scope: MemoryScope;
    partition?: string;
    sourceKind?: SourceKind;
    metadata?: Record<string, unknown>;
  }>,
  workflowRunId?: string,
): Promise<void> {
  if (!records.length) return;

  await prisma.memoryChunk.createMany({
    data: records.map((r) => ({
      chromaId: r.id,
      scopeKind: r.scope.kind,
      scopeId: r.scope.id ?? null,
      partition: r.partition ?? 'default',
      sourceKind: r.sourceKind ?? 'domain',
      contentExcerpt: r.text.slice(0, 500),
      contentHash: createHash('sha256').update(r.text).digest('hex').slice(0, 64),
      metadata: (r.metadata ?? null) as Prisma.InputJsonValue,
      workflowRunId: workflowRunId ?? null,
      status: 'indexed',
    })),
  });
}

export async function listMemoryChunks(args: {
  scopeKind?: string;
  scopeId?: string;
  partition?: string;
  limit?: number;
}) {
  const limit = Math.min(args.limit ?? 50, 200);
  return prisma.memoryChunk.findMany({
    where: {
      ...(args.scopeKind ? { scopeKind: args.scopeKind } : {}),
      ...(args.scopeId ? { scopeId: args.scopeId } : {}),
      ...(args.partition ? { partition: args.partition } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}