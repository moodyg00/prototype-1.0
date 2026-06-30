import type { MemoryAgentBinding, MemoryChunkDraft, MemoryScope, SourceKind } from './types';
import { scopeKey } from './types';

export type TagInput = {
  drafts: MemoryChunkDraft[];
  scope?: MemoryScope;
  partition?: string;
  sourceKind?: SourceKind;
  agentId?: string;
  groupId?: string;
  labels?: string[];
  binding?: MemoryAgentBinding;
};

export function applyTags(input: TagInput): MemoryChunkDraft[] {
  const scope = input.scope ?? { kind: 'global' as const };
  if (input.binding) {
    const writeKeys = new Set(input.binding.writeScopes.map(scopeKey));
    const key = scopeKey(scope);
    if (!writeKeys.has(key) && scope.kind !== 'global') {
      throw new Error(`Agent ${input.binding.agentId} cannot write to scope ${key}`);
    }
  }

  return input.drafts.map((d) => ({
    ...d,
    scope: d.scope ?? scope,
    partition: d.partition ?? input.partition ?? input.binding?.defaultPartition ?? 'default',
    sourceKind: d.sourceKind ?? input.sourceKind ?? 'domain',
    agentId: d.agentId ?? input.agentId ?? input.binding?.agentId,
    groupId: d.groupId ?? input.groupId,
    labels: [...(d.labels ?? []), ...(input.labels ?? [])],
    metadata: {
      ...(d.metadata ?? {}),
      scopeKey: scopeKey(d.scope ?? scope),
    },
  }));
}