import { getMemoryStore } from './store';
import type { RecallQuery, RecallHit } from './types';

export async function recallMemory(query: RecallQuery): Promise<RecallHit[]> {
  const store = getMemoryStore();
  return store.recall(query);
}