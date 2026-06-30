import type { MemoryAgentBinding, MemoryScope } from '@prototype/memory';
import { recallMemory } from '@prototype/memory';
import { prisma } from '@/src/lib/prisma';

function defaultBinding(agentId: string): MemoryAgentBinding {
  return {
    agentId,
    readScopes: [{ kind: 'global' }, { kind: 'agent', id: agentId }],
    writeScopes: [{ kind: 'agent', id: agentId }],
    defaultPartition: 'default',
  };
}

async function getBinding(agentId: string): Promise<MemoryAgentBinding> {
  const row = await prisma.memoryAgentBinding.findUnique({ where: { agentId } });
  if (!row) return defaultBinding(agentId);
  return {
    agentId: row.agentId,
    readScopes: row.readScopes as MemoryScope[],
    writeScopes: row.writeScopes as MemoryScope[],
    defaultPartition: row.defaultPartition,
  };
}

export async function vectorSearchMemories(agentId: string, query: string, limit = 15) {
  const binding = await getBinding(agentId);
  const hits = await recallMemory({ agentId, query, topK: limit, binding });
  return { count: hits.length, hits, source: 'vector' as const };
}

export async function bulkIngestViaAgent(args: {
  text: string;
  scopeKind?: 'global' | 'agent' | 'group';
  scopeId?: string;
  agentId?: string;
  sourceKind?: string;
}) {
  const base = (process.env.AGENT_APP_URL ?? 'http://127.0.0.1:3002').replace(/\/$/, '');
  const res = await fetch(`${base}/api/memory/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: args.text,
      scopeKind: args.scopeKind ?? 'global',
      scopeId: args.scopeId,
      agentId: args.agentId ?? args.scopeId ?? 'default',
      sourceKind: args.sourceKind ?? 'seed',
    }),
  });
  const json = (await res.json()) as { error?: string; workflowRunId?: string };
  if (!res.ok) throw new Error(json.error ?? 'Bulk ingest failed');
  return json;
}