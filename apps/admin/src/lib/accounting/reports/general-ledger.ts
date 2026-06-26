import 'server-only';

import { sum, toAmountString } from '@/src/lib/accounting/money';
import { excludeIgnoredBankJournalEntriesFilter } from '@/src/lib/banking/ignored-journal-entry-ids';
import { prisma } from '@/src/lib/prisma';
import type { GeneralLedgerReport } from '@/src/lib/accounting/reports/types';

const MAX_LINES = 10_000;

export async function buildGeneralLedgerReport(from: string, to: string): Promise<GeneralLedgerReport> {
  const ignoredJournalFilter = await excludeIgnoredBankJournalEntriesFilter();
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        is: {
          status: { in: ['Posted', 'Reversed'] },
          entryDate: { gte: fromDate, lte: toDate },
          ...ignoredJournalFilter,
        },
      },
    },
    orderBy: [
      { journalEntry: { entryDate: 'asc' } },
      { journalEntry: { entryNumber: 'asc' } },
      { position: 'asc' },
    ],
    take: MAX_LINES,
    include: {
      account: { select: { code: true, name: true } },
      journalEntry: {
        select: {
          entryDate: true,
          entryNumber: true,
          reference: true,
          description: true,
        },
      },
    },
  });

  const mapped = lines.map((line) => ({
    entryDate: line.journalEntry.entryDate.toISOString().slice(0, 10),
    entryNumber: line.journalEntry.entryNumber,
    accountCode: line.account.code,
    accountName: line.account.name,
    description: line.description ?? line.journalEntry.description,
    reference: line.journalEntry.reference,
    debit: toAmountString(line.debit),
    credit: toAmountString(line.credit),
  }));

  return {
    reportType: 'general-ledger',
    title: 'General Ledger',
    from,
    to,
    generatedAt: new Date().toISOString(),
    lines: mapped,
    totalDebits: toAmountString(sum(mapped.map((line) => line.debit))),
    totalCredits: toAmountString(sum(mapped.map((line) => line.credit))),
  };
}
