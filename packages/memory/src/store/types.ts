import type { MemoryChunkRecord, RecallHit, RecallQuery } from '../types';

export interface MemoryStore {
  upsert(chunks: MemoryChunkRecord[]): Promise<void>;
  recall(query: RecallQuery): Promise<RecallHit[]>;
  deleteByIds(ids: string[]): Promise<void>;
  stats(): Promise<{ documentCount: number }>;
}