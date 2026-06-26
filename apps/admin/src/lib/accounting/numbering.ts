/**
 * Document identifier allocation.
 *
 * Customer-facing documents (invoices, estimates) use Postgres sequences for
 * short sequential numbers (`INV-0042`, `EST-003`). Internal documents (journal
 * entries, work orders) use opaque UUIDs assigned at create time.
 *
 * For sequenced kinds:
 *   - allocateNumber(kind, tx): MUST run inside the same transaction as the
 *     row insert. Calls nextval(...) which is atomic in Postgres.
 *   - previewNextNumber(kind): read-only peek for editors; does not advance
 *     the sequence.
 */
import 'server-only';

import { randomUUID } from 'node:crypto';

import type { Prisma, PrismaClient } from '@prototype/db';

import { prisma } from '@/src/lib/prisma';

export type NumberedKind = 'invoice' | 'estimate';

export interface NumberFormat {
  /** Human-readable prefix, e.g. `JE`, `INV`, `EST`. */
  prefix: string;
  /** Zero-padding width applied to the numeric suffix. */
  pad: number;
  /** Postgres sequence backing this kind. */
  sequenceName: string;
}

export const FORMATS: Record<NumberedKind, NumberFormat> = {
  invoice: { prefix: 'INV', pad: 4, sequenceName: 'document_number_invoice_seq' },
  estimate: { prefix: 'EST', pad: 3, sequenceName: 'document_number_estimate_seq' },
};

/** Opaque identifier for internal documents (journal entries, work orders). */
export function allocateOpaqueDocumentNumber(): string {
  return randomUUID();
}

type RawClient = PrismaClient | Prisma.TransactionClient;

function format(kind: NumberedKind, value: bigint | number): string {
  const fmt = FORMATS[kind];
  return `${fmt.prefix}-${String(value).padStart(fmt.pad, '0')}`;
}

/**
 * Allocate the next number for `kind` and return its formatted form.
 *
 * Must be called from inside the same transaction as the row insert so a
 * failed insert can be rolled back. Postgres sequences are not transactional
 * — a rolled-back nextval still consumes a value — so callers are expected
 * to accept gaps (this is the standard accounting convention).
 */
export async function allocateNumber(
  kind: NumberedKind,
  tx: Prisma.TransactionClient,
): Promise<string> {
  const fmt = FORMATS[kind];
  const rows = await tx.$queryRawUnsafe<Array<{ next: bigint }>>(
    `SELECT nextval('${fmt.sequenceName}') AS next`,
  );
  const value = rows[0]?.next;
  if (value === undefined || value === null) {
    throw new Error(`Failed to allocate number for kind=${kind}.`);
  }
  return format(kind, value);
}

/**
 * Cheap, non-mutating preview of the next number.
 *
 * Reads the sequence relation directly (`SELECT last_value, is_called FROM
 * <seq>`), which works across sessions, unlike `currval()`. If the sequence
 * has never been called (`is_called = false`), the next value is `last_value`
 * itself. Otherwise it is `last_value + 1`. Falls back to "1" if the
 * sequence cannot be read for any reason (e.g. the migration hasn't run yet
 * in a fresh dev shell).
 */
export async function previewNextNumber(
  kind: NumberedKind,
  client: RawClient = prisma,
): Promise<string> {
  const fmt = FORMATS[kind];
  try {
    const rows = await client.$queryRawUnsafe<
      Array<{ last_value: bigint; is_called: boolean }>
    >(`SELECT last_value, is_called FROM ${fmt.sequenceName}`);
    const row = rows[0];
    if (!row) return format(kind, 1);
    const next = row.is_called ? Number(row.last_value) + 1 : Number(row.last_value);
    return format(kind, next > 0 ? next : 1);
  } catch {
    return format(kind, 1);
  }
}
