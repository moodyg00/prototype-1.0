import type { MemoryAgentBinding, MemoryScope } from '@prototype/memory';
import type { Prisma } from '@prototype/db';

import { withoutLegacyCsuiteAgentIds } from '../agents/legacy-csuite';
import { prisma } from '../prisma';

const DEFAULT_AGENT_IDS = ['default'];

function defaultBinding(agentId: string): MemoryAgentBinding {
  return {
    agentId,
    readScopes: [
      { kind: 'global' },
      { kind: 'agent', id: agentId },
      { kind: 'group', id: 'finance' },
      { kind: 'group', id: 'operations' },
    ],
    writeScopes: [{ kind: 'agent', id: agentId }],
    defaultPartition: 'default',
  };
}

function rowToBinding(row: {
  agentId: string;
  readScopes: Prisma.JsonValue;
  writeScopes: Prisma.JsonValue;
  defaultPartition: string;
}): MemoryAgentBinding {
  return {
    agentId: row.agentId,
    readScopes: row.readScopes as MemoryScope[],
    writeScopes: row.writeScopes as MemoryScope[],
    defaultPartition: row.defaultPartition,
  };
}

export async function getMemoryBinding(agentId: string): Promise<MemoryAgentBinding> {
  try {
    if (!prisma?.memoryAgentBinding) return defaultBinding(agentId);
    const row = await prisma.memoryAgentBinding.findUnique({ where: { agentId } });
    if (row) return rowToBinding(row);
  } catch {
    // catalog not migrated — use in-memory defaults
  }
  return defaultBinding(agentId);
}

export async function saveMemoryBinding(binding: MemoryAgentBinding): Promise<MemoryAgentBinding> {
  const row = await prisma.memoryAgentBinding.upsert({
    where: { agentId: binding.agentId },
    create: {
      agentId: binding.agentId,
      readScopes: binding.readScopes as Prisma.InputJsonValue,
      writeScopes: binding.writeScopes as Prisma.InputJsonValue,
      defaultPartition: binding.defaultPartition ?? 'default',
    },
    update: {
      readScopes: binding.readScopes as Prisma.InputJsonValue,
      writeScopes: binding.writeScopes as Prisma.InputJsonValue,
      defaultPartition: binding.defaultPartition ?? 'default',
    },
  });
  return rowToBinding(row);
}

export async function listKnownAgentIds(): Promise<string[]> {
  try {
    if (!prisma?.memoryAgentBinding) return [...DEFAULT_AGENT_IDS];
    const rows = await prisma.memoryAgentBinding.findMany({ select: { agentId: true } });
    const ids = new Set([...DEFAULT_AGENT_IDS, ...rows.map((r: { agentId: string }) => r.agentId)]);
    return withoutLegacyCsuiteAgentIds([...ids]).sort();
  } catch {
    return [...DEFAULT_AGENT_IDS];
  }
}