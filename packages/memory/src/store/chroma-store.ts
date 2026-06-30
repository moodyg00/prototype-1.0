import { ChromaClient } from 'chromadb';
import { randomUUID } from 'crypto';

import { getEmbedder } from '../embed';
import type { MemoryChunkRecord, RecallHit, RecallQuery } from '../types';
import { scopeKey } from '../types';
import type { MemoryStore } from './types';

export type ChromaStoreOptions = {
  url?: string;
  collectionName?: string;
};

function chunkToMetadata(chunk: MemoryChunkRecord): Record<string, string | number | boolean> {
  const meta: Record<string, string | number | boolean> = {
    scopeKey: scopeKey(chunk.scope),
    scopeKind: chunk.scope.kind,
    partition: chunk.partition ?? 'default',
    sourceKind: chunk.sourceKind ?? 'domain',
  };
  if (chunk.scope.id) meta.scopeId = chunk.scope.id;
  if (chunk.agentId) meta.agentId = chunk.agentId;
  if (chunk.groupId) meta.groupId = chunk.groupId;
  return meta;
}

export class ChromaMemoryStore implements MemoryStore {
  private client: ChromaClient;
  private collectionName: string;
  private get embedder() {
    return getEmbedder();
  }

  constructor(options: ChromaStoreOptions = {}) {
    const url = options.url ?? process.env.CHROMA_URL ?? 'http://localhost:8000';
    this.collectionName = options.collectionName ?? process.env.CHROMA_COLLECTION ?? 'mhp_memory';
    this.client = new ChromaClient({ path: url });
  }

  private async collection() {
    return this.client.getOrCreateCollection({ name: this.collectionName });
  }

  async upsert(chunks: MemoryChunkRecord[]): Promise<void> {
    if (!chunks.length) return;
    const col = await this.collection();
    const ids: string[] = [];
    const documents: string[] = [];
    const embeddings: number[][] = [];
    const metadatas: Record<string, string | number | boolean>[] = [];

    for (const chunk of chunks) {
      const id = chunk.id || randomUUID();
      ids.push(id);
      documents.push(chunk.text);
      embeddings.push(chunk.embedding ?? (await this.embedder.embed(chunk.text)));
      metadatas.push(chunkToMetadata({ ...chunk, id }));
    }

    await col.upsert({ ids, documents, embeddings, metadatas });
  }

  async recall(query: RecallQuery): Promise<RecallHit[]> {
    const col = await this.collection();
    const topK = query.topK ?? 8;
    const qVec = await this.embedder.embed(query.query);

    const readKeys = query.binding?.readScopes.map(scopeKey) ?? ['global'];
    const where =
      readKeys.length === 1
        ? { scopeKey: readKeys[0]! }
        : { scopeKey: { $in: readKeys } };

    const result = await col.query({
      queryEmbeddings: [qVec],
      nResults: topK,
      where,
      include: ['documents', 'metadatas', 'distances'],
    });

    const ids = result.ids[0] ?? [];
    const docs = result.documents[0] ?? [];
    const metas = result.metadatas[0] ?? [];
    const distances = result.distances?.[0] ?? [];

    return ids.map((id, i) => ({
      id: id ?? randomUUID(),
      text: docs[i] ?? '',
      score: distances[i] != null ? 1 / (1 + distances[i]) : 0,
      metadata: (metas[i] as Record<string, unknown>) ?? {},
    }));
  }

  async deleteByIds(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const col = await this.collection();
    await col.delete({ ids });
  }

  async stats(): Promise<{ documentCount: number }> {
    const col = await this.collection();
    const count = await col.count();
    return { documentCount: count };
  }
}