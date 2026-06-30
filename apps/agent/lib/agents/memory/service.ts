import type { Prisma } from '@prototype/db';

import { prisma } from '../../prisma';

export type MemoryEventType = 'scene' | 'persona' | 'turn' | 'tool';

export type MemoryEventRecord = {
  id: string;
  agentId: string;
  type: MemoryEventType;
  level: number;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

function toRecord(row: {
  id: string;
  agentId: string;
  type: string;
  level: number;
  content: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): MemoryEventRecord {
  return {
    id: row.id,
    agentId: row.agentId,
    type: row.type as MemoryEventType,
    level: row.level,
    content: row.content,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class AgentMemoryService {
  async logEvent(args: {
    agentId: string;
    type: MemoryEventType;
    content: string;
    level?: number;
    metadata?: Record<string, unknown>;
  }): Promise<MemoryEventRecord> {
    const row = await prisma.agentMemoryEvent.create({
      data: {
        agentId: args.agentId,
        type: args.type,
        level: args.level ?? 2,
        content: args.content,
        metadata: (args.metadata ?? null) as Prisma.InputJsonValue,
      },
    });
    return toRecord(row);
  }

  async search(agentId: string, query: string, limit = 20): Promise<MemoryEventRecord[]> {
    const rows = await prisma.agentMemoryEvent.findMany({
      where: {
        agentId,
        content: { contains: query, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toRecord);
  }

  async recallRecent(agentId: string, limit = 30): Promise<MemoryEventRecord[]> {
    const rows = await prisma.agentMemoryEvent.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toRecord);
  }

  async handleTurnCommitted(args: {
    agentId: string;
    input: string;
    output: string;
    toolsUsed?: string[];
  }): Promise<void> {
    await this.logEvent({
      agentId: args.agentId,
      type: 'turn',
      level: 2,
      content: `User: ${args.input}\nAgent: ${args.output}`,
      metadata: { toolsUsed: args.toolsUsed ?? [] },
    });

    const text = `Turn for agent ${args.agentId}\nUser: ${args.input}\nAgent: ${args.output}`;
    void import('@/lib/memory/run-ingest')
      .then(({ runMemoryIngestWorkflow }) =>
        runMemoryIngestWorkflow(
          JSON.stringify({
            text,
            scopeKind: 'agent',
            scopeId: args.agentId,
            sourceKind: 'turn',
            agentId: args.agentId,
          }),
        ),
      )
      .catch((err) => console.error('[memory] turn capture failed', err));
  }
}

export const agentMemoryService = new AgentMemoryService();