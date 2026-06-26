import { prisma } from '@/src/lib/prisma';

import { isBankTransactionIgnored } from '@/src/lib/banking/ignore-transaction';

export type BankTransactionListItem = {
  id: string;
  date: string;
  avatar: string;
  name: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  ignored: boolean;
  bankAccountName: string;
  providerStatus: string | null;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  internalCategory: string | null;
  ruleResolutionStatus: string;
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0] ?? '').join('').toUpperCase() || 'TX';
}

function toDisplayStatus(status: string, providerStatus: string | null, ignored: boolean): string {
  if (ignored) return 'ignored';
  if (status === 'reconciled') return 'reconciled';
  if (providerStatus === 'failed' || providerStatus === 'blocked') return 'failed';
  if (providerStatus === 'pending') return 'pending';
  return 'posted';
}

function mapRow(row: {
  id: string;
  transactionDate: Date;
  amount: { toString(): string } | number;
  description: string | null;
  status: string;
  providerStatus: string | null;
  journalEntryId: string | null;
  internalCategory: string | null;
  ruleResolutionStatus: string;
  ignoredAt: Date | null;
  merchant: { displayName: string; avatarInitials: string | null } | null;
  counterpartyName: string | null;
  bankAccount: { name: string };
  journalEntry: { id: string; entryNumber: string } | null;
}): BankTransactionListItem {
  const name = row.merchant?.displayName ?? row.counterpartyName ?? 'Unknown';
  const amount = Number(row.amount);
  const ignored = isBankTransactionIgnored(row.ignoredAt);
  return {
    id: row.id,
    date: row.transactionDate.toISOString().slice(0, 10),
    avatar: row.merchant?.avatarInitials ?? initialsFor(name),
    name,
    description: row.description ?? '',
    amount,
    type: amount >= 0 ? 'income' : 'expense',
    status: toDisplayStatus(row.status, row.providerStatus, ignored),
    ignored,
    bankAccountName: row.bankAccount.name,
    providerStatus: row.providerStatus,
    journalEntryId: row.journalEntryId,
    journalEntryNumber: row.journalEntry?.entryNumber ?? null,
    internalCategory: row.internalCategory,
    ruleResolutionStatus: row.ruleResolutionStatus,
  };
}

export async function listBankTransactions(args: {
  q?: string;
  filter?: 'all' | 'income' | 'expense' | 'pending' | 'ignored';
  limit?: number;
  offset?: number;
}): Promise<{ items: BankTransactionListItem[]; total: number }> {
  const term = args.q?.trim();
  const limit = Math.min(Math.max(args.limit ?? 50, 1), 200);
  const offset = Math.max(args.offset ?? 0, 0);

  const where = {
    ...(term
      ? {
          OR: [
            { description: { contains: term, mode: 'insensitive' as const } },
            { counterpartyName: { contains: term, mode: 'insensitive' as const } },
            { reference: { contains: term, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(args.filter === 'ignored'
      ? { ignoredAt: { not: null } }
      : args.filter === 'income'
        ? { ignoredAt: null, amount: { gte: 0 } }
        : args.filter === 'expense'
          ? { ignoredAt: null, amount: { lt: 0 } }
          : args.filter === 'pending'
            ? {
                ignoredAt: null,
                OR: [
                  { status: 'pending' },
                  { providerStatus: { in: ['pending', 'failed', 'blocked'] } },
                ],
              }
            : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.bankTransaction.findMany({
      where,
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
      include: {
        merchant: { select: { displayName: true, avatarInitials: true } },
        bankAccount: { select: { name: true } },
        journalEntry: { select: { id: true, entryNumber: true } },
      },
    }),
    prisma.bankTransaction.count({ where }),
  ]);

  return {
    total,
    items: rows.map(mapRow),
  };
}

export type BankTransactionDetail = BankTransactionListItem & {
  reference: string | null;
  counterpartyName: string | null;
  providerTransactionId: string | null;
  rawPayload: unknown;
};

export async function getBankTransactionDetail(id: string): Promise<BankTransactionDetail | null> {
  const row = await prisma.bankTransaction.findUnique({
    where: { id },
    include: {
      merchant: { select: { displayName: true, avatarInitials: true } },
      bankAccount: { select: { name: true } },
      journalEntry: { select: { id: true, entryNumber: true } },
    },
  });
  if (!row) return null;

  return {
    ...mapRow(row),
    reference: row.reference,
    counterpartyName: row.counterpartyName,
    providerTransactionId: row.providerTransactionId,
    rawPayload: row.providerRawPayload,
  };
}
