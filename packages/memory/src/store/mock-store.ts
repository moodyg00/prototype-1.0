import type { MemoryChunkRecord, RecallHit, RecallQuery } from '../types';
import { scopeKey } from '../types';
import type { MemoryStore } from './types';

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

function allowedScopeKeys(query: RecallQuery): Set<string> {
  if (!query.binding) return new Set(['global']);
  return new Set(query.binding.readScopes.map(scopeKey));
}

export class MockMemoryStore implements MemoryStore {
  private docs = new Map<string, MemoryChunkRecord>();

  async upsert(chunks: MemoryChunkRecord[]): Promise<void> {
    for (const c of chunks) this.docs.set(c.id, c);
  }

  async recall(query: RecallQuery): Promise<RecallHit[]> {
    const allowed = allowedScopeKeys(query);
    const { StubEmbedder } = await import('../embed');
    const embedder = new StubEmbedder();
    const qVec = await embedder.embed(query.query);
    const topK = query.topK ?? 8;

    const hits: RecallHit[] = [];
    for (const doc of this.docs.values()) {
      const key = scopeKey(doc.scope);
      if (!allowed.has(key) && doc.scope.kind !== 'global') continue;
      if (!allowed.has('global') && doc.scope.kind === 'global' && query.binding) {
        if (!query.binding.readScopes.some((s) => s.kind === 'global')) continue;
      }
      const score = doc.embedding ? cosine(qVec, doc.embedding) : 0;
      hits.push({
        id: doc.id,
        text: doc.text,
        score,
        metadata: {
          scopeKey: key,
          partition: doc.partition,
          sourceKind: doc.sourceKind,
          ...(doc.metadata ?? {}),
        },
      });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  async deleteByIds(ids: string[]): Promise<void> {
    for (const id of ids) this.docs.delete(id);
  }

  async stats(): Promise<{ documentCount: number }> {
    return { documentCount: this.docs.size };
  }
}