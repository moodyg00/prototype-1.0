import type { MemoryChunkDraft } from './types';

export type ShardOptions = {
  maxChars?: number;
  overlapChars?: number;
};

const DEFAULT_MAX = 1200;
const DEFAULT_OVERLAP = 120;

export function shardText(text: string, options: ShardOptions = {}): string[] {
  const max = options.maxChars ?? DEFAULT_MAX;
  const overlap = options.overlapChars ?? DEFAULT_OVERLAP;
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= max) return [trimmed];

  const chunks: string[] = [];
  let start = 0;
  while (start < trimmed.length) {
    const end = Math.min(start + max, trimmed.length);
    chunks.push(trimmed.slice(start, end).trim());
    if (end >= trimmed.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks.filter(Boolean);
}

export function shardToDrafts(
  rawText: string,
  base: Omit<MemoryChunkDraft, 'text'>,
  options?: ShardOptions,
): MemoryChunkDraft[] {
  return shardText(rawText, options).map((text) => ({ ...base, text }));
}