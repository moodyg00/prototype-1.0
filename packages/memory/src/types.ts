export type MemoryScopeKind = 'global' | 'agent' | 'group';

export type MemoryScope = {
  kind: MemoryScopeKind;
  id?: string;
};

export type SourceKind = 'turn' | 'thought' | 'seed' | 'domain' | 'fact';

export type MemoryChunkDraft = {
  text: string;
  scope: MemoryScope;
  partition?: string;
  sourceKind?: SourceKind;
  agentId?: string;
  groupId?: string;
  labels?: string[];
  metadata?: Record<string, unknown>;
};

export type MemoryChunkRecord = MemoryChunkDraft & {
  id: string;
  embedding?: number[];
};

export type MemoryAgentBinding = {
  agentId: string;
  readScopes: MemoryScope[];
  writeScopes: MemoryScope[];
  defaultPartition?: string;
};

export type RecallQuery = {
  agentId: string;
  query: string;
  topK?: number;
  binding?: MemoryAgentBinding;
};

export type RecallHit = {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
};

export function scopeKey(scope: MemoryScope): string {
  if (scope.kind === 'global') return 'global';
  if (!scope.id) throw new Error(`Scope ${scope.kind} requires id`);
  return `${scope.kind}:${scope.id}`;
}

export function parseScopeKey(key: string): MemoryScope {
  if (key === 'global') return { kind: 'global' };
  const [kind, ...rest] = key.split(':');
  const id = rest.join(':');
  if (kind === 'agent' || kind === 'group') return { kind, id };
  throw new Error(`Invalid scope key: ${key}`);
}