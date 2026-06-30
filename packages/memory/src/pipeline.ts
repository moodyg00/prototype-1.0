import { randomUUID } from 'crypto';

import { StubEmbedder } from './embed';
import { getMemoryStore } from './store';
import { shardToDrafts } from './shard';
import { applyTags, type TagInput } from './tag';
import type { MemoryChunkRecord, MemoryScope, SourceKind } from './types';

export type IngestPayload = {
  text: string;
  scope?: MemoryScope;
  partition?: string;
  sourceKind?: SourceKind;
  agentId?: string;
  groupId?: string;
  labels?: string[];
  maxChars?: number;
};

export async function runMemoryIngestPipeline(
  payload: IngestPayload,
  tagExtras: Omit<TagInput, 'drafts'> = {},
): Promise<{ chunkIds: string[]; count: number }> {
  const drafts = shardToDrafts(payload.text, {
    scope: payload.scope ?? { kind: 'global' },
    partition: payload.partition,
    sourceKind: payload.sourceKind ?? 'domain',
    agentId: payload.agentId,
    groupId: payload.groupId,
    labels: payload.labels,
  }, { maxChars: payload.maxChars });

  const tagged = applyTags({
    drafts,
    scope: payload.scope,
    partition: payload.partition,
    sourceKind: payload.sourceKind,
    agentId: payload.agentId,
    groupId: payload.groupId,
    labels: payload.labels,
    ...tagExtras,
  });

  const embedder = new StubEmbedder();
  const texts = tagged.map((t) => t.text);
  const vectors = await embedder.embedMany(texts);

  const records: MemoryChunkRecord[] = tagged.map((t, i) => ({
    ...t,
    id: randomUUID(),
    embedding: vectors[i],
  }));

  const store = getMemoryStore();
  await store.upsert(records);

  return { chunkIds: records.map((r) => r.id), count: records.length };
}