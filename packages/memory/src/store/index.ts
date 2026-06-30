import { ChromaMemoryStore } from './chroma-store';
import { MockMemoryStore } from './mock-store';
import type { MemoryStore } from './types';

let singleton: MemoryStore | null = null;

export function getMemoryStore(): MemoryStore {
  if (singleton) return singleton;
  const useMock = process.env.MEMORY_STORE === 'mock' || !process.env.CHROMA_URL;
  singleton = useMock ? new MockMemoryStore() : new ChromaMemoryStore();
  return singleton;
}

export function resetMemoryStoreForTests(): void {
  singleton = null;
}

export type { MemoryStore } from './types';
export { MockMemoryStore } from './mock-store';
export { ChromaMemoryStore } from './chroma-store';