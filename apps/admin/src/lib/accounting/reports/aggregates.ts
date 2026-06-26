import 'server-only';

import { Prisma } from '@prototype/db';
import { isDebitNatural } from '@/src/lib/accounting/journal-entries';
import { toAmountString, toDecimal } from '@/src/lib/accounting/money';
import { excludeIgnoredBankJournalEntriesFilter } from '@/src/lib/banking/ignored-journal-entry-ids';
import { prisma } from '@/src/lib/prisma';

export type AccountAggregate = {
  accountId: string;
  code: string;
  name: string;
  type: string;
  subType: string | null;
  debitTotal: string;
  creditTotal: string;
  balance: string;
};

function parseEndDate(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

function parseStartDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function signedBalance(
  type: string,
  debit: Prisma.Decimal,
  credit: Prisma.Decimal,
): Prisma.Decimal {
  const debitNatural = isDebitNatural(type);
  return debitNatural ? toDecimal(debit).sub(toDecimal(credit)) : toDecimal(credit).sub(toDecimal(debit));
}

function toAggregateRow(
  account: {
    id: string;
    code: string;
    name: string;
    type: string;
    subType: string | null;
  },
  debit: Prisma.Decimal,
  credit: Prisma.Decimal,
): AccountAggregate {
  return {
    accountId: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    subType: account.subType,
    debitTotal: toAmountString(debit),
    creditTotal: toAmountString(credit),
    balance: toAmountString(signedBalance(account.type, debit, credit)),
  };
}

export async function aggregateAccountsThroughDate(to: string): Promise<AccountAggregate[]> {
  const ignoredJournalFilter = await excludeIgnoredBankJournalEntriesFilter();
  const toDate = parseEndDate(to);

  const [accounts, grouped] = await Promise.all([
    prisma.chartOfAccount.findMany({
      select: { id: true, code: true, name: true, type: true, subType: true },
      orderBy: [{ code: 'asc' }],
    }),
    prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          is: {
            status: { in: ['Posted', 'Reversed'] },
            entryDate: { lte: toDate },
            ...ignoredJournalFilter,
          },
        },
      },
      _sum: { debit: true, credit: true },
    }),
  ]);

  const totalsByAccount = new Map(
    grouped.map((row) => [
      row.accountId,
      {
        debit: row._sum.debit ?? new Prisma.Decimal(0),
        credit: row._sum.credit ?? new Prisma.Decimal(0),
      },
    ]),
  );

  return accounts
    .map((account) => {
      const totals = totalsByAccount.get(account.id) ?? {
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0),
      };
      return toAggregateRow(account, totals.debit, totals.credit);
    })
    .filter((row) => !toDecimal(row.balance).isZero() || !toDecimal(row.debitTotal).isZero() || !toDecimal(row.creditTotal).isZero());
}

export async function aggregateAccountsForPeriod(from: string, to: string): Promise<AccountAggregate[]> {
  const ignoredJournalFilter = await excludeIgnoredBankJournalEntriesFilter();
  const fromDate = parseStartDate(from);
  const toDate = parseEndDate(to);

  const [accounts, grouped] = await Promise.all([
    prisma.chartOfAccount.findMany({
      select: { id: true, code: true, name: true, type: true, subType: true },
      orderBy: [{ code: 'asc' }],
    }),
    prisma.journalEntryLine.groupBy({
      by: ['accountId'],
      where: {
        journalEntry: {
          is: {
            status: { in: ['Posted', 'Reversed'] },
            entryDate: { gte: fromDate, lte: toDate },
            ...ignoredJournalFilter,
          },
        },
      },
      _sum: { debit: true, credit: true },
    }),
  ]);

  const totalsByAccount = new Map(
    grouped.map((row) => [
      row.accountId,
      {
        debit: row._sum.debit ?? new Prisma.Decimal(0),
        credit: row._sum.credit ?? new Prisma.Decimal(0),
      },
    ]),
  );

  return accounts
    .map((account) => {
      const totals = totalsByAccount.get(account.id) ?? {
        debit: new Prisma.Decimal(0),
        credit: new Prisma.Decimal(0),
      };
      return toAggregateRow(account, totals.debit, totals.credit);
    })
    .filter((row) => !toDecimal(row.balance).isZero());
}
