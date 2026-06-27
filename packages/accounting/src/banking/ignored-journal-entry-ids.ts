
import type { Prisma } from '@prototype/db';
import { getAccountingPrisma } from '../db';

/**
 * Journal entry IDs still linked to ignored bank transactions.
 * Uses raw SQL so ledger queries stay valid even when the runtime
 * Prisma client is briefly out of sync with the schema.
 */
export async function journalEntryIdsLinkedToIgnoredTransactions(): Promise<string[]> {
  const rows = await getAccountingPrisma().$queryRaw<Array<{ journal_entry_id: string }>>`
    SELECT DISTINCT journal_entry_id
    FROM bank_transactions
    WHERE ignored_at IS NOT NULL
      AND journal_entry_id IS NOT NULL
  `;
  return rows.map((row) => row.journal_entry_id);
}

export async function excludeIgnoredBankJournalEntriesFilter(): Promise<Prisma.JournalEntryWhereInput> {
  const ids = await journalEntryIdsLinkedToIgnoredTransactions();
  if (ids.length === 0) return {};
  return { id: { notIn: ids } };
}
