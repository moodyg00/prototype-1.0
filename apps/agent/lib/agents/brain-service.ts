import type { AgentMemoryEvent, MemoryChunk } from '@prototype/db';

import { invokeIdeChat } from '@/lib/integrations/ide-llm';
import { prisma } from '@/lib/prisma';
import { listMemoryChunks } from '@/lib/memory/catalog';
import type { WorkspaceAgent } from './types';

export type AgentBrainSnapshot = {
  agentId: string;
  events: Array<{
    id: string;
    type: string;
    level: number;
    content: string;
    createdAt: string;
    metadata: unknown;
  }>;
  chunks: Array<{
    id: string;
    contentExcerpt: string;
    partition: string;
    sourceKind: string;
    status: string;
    createdAt: string;
  }>;
  counts: {
    events: number;
    eventsListed: number;
    chunksAgentScope: number;
    chunksListed: number;
  };
  store: { label: string; documentCount?: number };
};

export async function getAgentBrainSnapshot(agentId: string): Promise<AgentBrainSnapshot> {
  const [events, eventTotal, chunks, chunkCount, storeStats] = await Promise.all([
    prisma.agentMemoryEvent
      .findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: 40,
      })
      .catch(() => [] as AgentMemoryEvent[]),
    prisma.agentMemoryEvent.count({ where: { agentId } }).catch(() => 0),
    listMemoryChunks({ scopeKind: 'agent', scopeId: agentId, limit: 25 }).catch(
      () => [] as MemoryChunk[],
    ),
    prisma.memoryChunk
      .count({ where: { scopeKind: 'agent', scopeId: agentId } })
      .catch(() => 0),
    (async () => {
      try {
        const { getMemoryStore } = await import('@prototype/memory');
        const stats = await getMemoryStore().stats();
        return {
          label: process.env.CHROMA_URL ? 'chroma' : 'mock',
          documentCount: stats.documentCount,
        };
      } catch {
        return { label: 'unknown' as const };
      }
    })(),
  ]);

  return {
    agentId,
    events: events.map((e: AgentMemoryEvent) => ({
      id: e.id,
      type: e.type,
      level: e.level,
      content: e.content,
      createdAt: e.createdAt.toISOString(),
      metadata: e.metadata,
    })),
    chunks: chunks.map((c: MemoryChunk) => ({
      id: c.id,
      contentExcerpt: c.contentExcerpt,
      partition: c.partition,
      sourceKind: c.sourceKind,
      status: c.status,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    })),
    counts: {
      events: eventTotal,
      eventsListed: events.length,
      chunksAgentScope: chunkCount,
      chunksListed: chunks.length,
    },
    store: storeStats,
  };
}

export async function deleteAgentMemoryEvent(eventId: string): Promise<boolean> {
  try {
    await prisma.agentMemoryEvent.delete({ where: { id: eventId } });
    return true;
  } catch {
    return false;
  }
}

export async function generateBrainResponse(
  agent: WorkspaceAgent,
  userMessage: string,
): Promise<string> {
  const persona = agent.persona;
  const systemPrompt = [
    `You are ${agent.name}.`,
    persona?.systemPrompt?.trim() ? persona.systemPrompt.trim() : 'You are a helpful AI assistant.',
    'Respond concisely. Keep your reply under 160 characters when possible.',
  ].join(' ');

  const result = await invokeIdeChat({
    modelId: agent.defaultModelId,
    systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return result.content.trim();
}