/**
 * Shared document-number allocation.
 *
 * Every numbered document type in the admin (journal entries, invoices,
 * estimates today; bills, credits, payments later) draws its canonical
 * number from a Postgres sequence. The sequence is the source of truth —
 * it gives us atomic, gap-free-on-success allocation without a SELECT MAX
 * race window.
 *
 * Two operations matter:
 *   - allocateNumber(kind, tx): MUST run inside the same transaction as the
 *     row insert. Calls nextval(...) which is atomic in Postgres and survives
 *     concurrent writers.
 *   - previewNextNumber(kind): a cheap, read-only peek used by the editor so
 *     the user can see "INV-0042" while drafting. It MUST NOT advance the
 *     sequence, so we read pg_sequences (or the sequence relation directly)
 *     to compute next without calling nextval. If the sequence has never
 *     been called we return its starting value (typically 1).
 *
 * The corresponding migration (prisma/migrations/<ts>_shared_sequences/
 * migration.sql) creates the sequences with `IF NOT EXISTS` and seeds each
 * sequence to the highest numeric suffix in the existing table so that
 * legacy data and freshly-allocated numbers never overlap.
 */
import 'server-only';

import type { Prisma, PrismaClient } from '@prototype/db';

import { prisma } from '@/src/lib/prisma';

export type NumberedKind = 'journal-entry' | 'invoice' | 'estimate' | 'work-order';

export interface NumberFormat {
  /** Human-readable prefix, e.g. `JE`, `INV`, `EST`. */
  prefix: string;
  /** Zero-padding width applied to the numeric suffix. */
  pad: number;
  /** Postgres sequence backing this kind. */
  sequenceName: string;
}

export const FORMATS: Record<NumberedKind, NumberFormat> = {
  'journal-entry': { prefix: 'JE', pad: 6, sequenceName: 'document_number_journal_entry_seq' },
  invoice: { prefix: 'INV', pad: 4, sequenceName: 'document_number_invoice_seq' },
  estimate: { prefix: 'EST', pad: 3, sequenceName: 'document_number_estimate_seq' },
  'work-order': { prefix: 'WO', pad: 4, sequenceName: 'document_number_work_order_seq' },
};

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
