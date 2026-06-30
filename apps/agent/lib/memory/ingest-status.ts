/** Catalog lifecycle for memory chunks (maps to MemoryChunk.status). */
export const INGEST_STATUSES = [
  'raw',
  'chunked',
  'tagged',
  'embedded',
  'indexed',
  'failed',
  'quarantined',
] as const;

export type IngestStatus = (typeof INGEST_STATUSES)[number];

export function isIngestStatus(value: string): value is IngestStatus {
  return (INGEST_STATUSES as readonly string[]).includes(value);
}