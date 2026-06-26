import { randomUUID } from 'node:crypto';

/** Opaque identifier for internal documents (journal entries, work orders). */
export function allocateOpaqueDocumentNumber(): string {
  return randomUUID();
}
