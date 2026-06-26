import { Prisma } from '@prototype/db';
import { createJournalEntry } from '@/src/lib/accounting/journal-entries';
import type { BankRuleAction } from '@/src/lib/banking/bank-rule-types';
import { logChange } from '@/src/lib/change-log';
import { prisma } from '@/src/lib/prisma';

const MERCHANT_CLEARING_CODE = '1200';
const SOURCE_MODULE = 'bank_transactions';

const INTERNAL_CATEGORY_COA_CODES: Record<string, string> = {
  merchant_clearing: '1200',
  opening_balance: '3900',
  owner_capital: '3000',
  software_subscriptions: '5200',
  marketing_expense: '5300',
  professional_fees: '6850',
  travel: '6650',
  bank_fees: '6050',
  interest_income: '8000',
  miscellaneous_expense: '7900',
};

export { JOURNAL_ALWAYS_DRAFT_CATEGORIES, journalMustStayDraft } from '@/src/lib/banking/bank-category-config';

export type JournalFromTransactionResult = {
  created: boolean;
  journalEntryId?: string;
  entryNumber?: string;
  reason?: string;
};

type TransactionWithAccount = {
  id: string;
  bankAccountId: string;
  cardId: string | null;
  amount: Prisma.Decimal;
  transactionDate: Date;
  transactionType: string;
  description: string | null;
  counterpartyName: string | null;
  providerTransactionId: string | null;
  providerStatus: string | null;
  internalCategory: string | null;
  ruleResolutionStatus: string;
  journalEntryId: string | null;
  ignoredAt: Date | null;
  bankAccount: {
    chartOfAccountId: string | null;
    name: string;
  };
};

async function resolveCoaIdByCode(code: string): Promise<string | null> {
  const account = await prisma.chartOfAccount.findFirst({
    where: { code, isActive: true },
    select: { id: true },
  });
  return account?.id ?? null;
}

function formatAmount(value: Prisma.Decimal | number): string {
  return Math.abs(Number(value)).toFixed(2);
}

function entryDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isEligibleForJournal(transaction: TransactionWithAccount): string | null {
  if (transaction.ignoredAt) return 'Transaction is ignored.';
  if (transaction.journalEntryId) return 'Journal entry already linked.';
  if (transaction.ruleResolutionStatus !== 'processed') return 'Transaction is not categorized by rules.';
  if (!transaction.internalCategory) return 'Missing internal category.';
  if (transaction.providerStatus !== 'sent') return 'Transaction is not posted in Mercury.';
  if (!transaction.bankAccount.chartOfAccountId) return 'Bank account is missing chart-of-accounts mapping.';
  return null;
}

async function resolveOffsetCoaCode(transaction: TransactionWithAccount): Promise<string | null> {
  const latestMatch = await prisma.bankTransactionRuleMatche.findFirst({
    where: {
      bankTransactionId: transaction.id,
      matched: true,
    },
    orderBy: { createdAt: 'desc' },
    select: { actionsSnapshot: true },
  });

  const action = latestMatch?.actionsSnapshot as BankRuleAction | null;
  if (action?.chartOfAccountCode) {
    return action.chartOfAccountCode;
  }

  if (transaction.internalCategory && INTERNAL_CATEGORY_COA_CODES[transaction.internalCategory]) {
    return INTERNAL_CATEGORY_COA_CODES[transaction.internalCategory];
  }

  return null;
}

async function resolveCreditAccountIdForExpense(transaction: TransactionWithAccount): Promise<string | null> {
  if (transaction.cardId) {
    return resolveCoaIdByCode(MERCHANT_CLEARING_CODE);
  }
  return transaction.bankAccount.chartOfAccountId;
}

async function findInternalTransferPair(transaction: TransactionWithAccount) {
  const amount = Number(transaction.amount);
  const absAmount = Math.abs(amount).toFixed(2);

  return prisma.bankTransaction.findFirst({
    where: {
      id: { not: transaction.id },
      ignoredAt: null,
      internalCategory: 'internal_transfer',
      ruleResolutionStatus: 'processed',
      journalEntryId: null,
      transactionDate: transaction.transactionDate,
      OR: [{ amount: absAmount }, { amount: `-${absAmount}` }],
      bankAccountId: { not: transaction.bankAccountId },
    },
    include: {
      bankAccount: { select: { chartOfAccountId: true, name: true } },
    },
  });
}

async function linkJournalToTransactions(journalEntryId: string, transactionIds: string[]) {
  await prisma.bankTransaction.updateMany({
    where: { id: { in: transactionIds } },
    data: { journalEntryId },
  });
}

async function createAndLinkJournalEntry(args: {
  transactionIds: string[];
  entryDate: string;
  description: string;
  reference: string | null;
  lines: Array<{ accountId: string; debit: string; credit: string; description?: string }>;
  metadata: Record<string, unknown>;
}): Promise<JournalFromTransactionResult> {
  const entry = await createJournalEntry(
    {
      entryDate: args.entryDate,
      description: args.description,
      reference: args.reference,
      sourceModule: SOURCE_MODULE,
      lines: args.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description ?? null,
      })),
    },
    { status: 'Draft', sourceModule: SOURCE_MODULE },
  );

  await linkJournalToTransactions(entry.id, args.transactionIds);

  for (const transactionId of args.transactionIds) {
    await logChange({
      tableName: 'bank_transactions',
      recordId: transactionId,
      action: 'automation',
      changes: {
        journalEntryId: entry.id,
        entryNumber: entry.entryNumber,
      },
      metadata: args.metadata,
    });
  }

  return {
    created: true,
    journalEntryId: entry.id,
    entryNumber: entry.entryNumber,
  };
}

async function createTransferJournalEntry(
  transaction: TransactionWithAccount,
): Promise<JournalFromTransactionResult> {
  const pair = await findInternalTransferPair(transaction);
  if (!pair?.bankAccount.chartOfAccountId) {
    return { created: false, reason: 'Waiting for paired internal transfer.' };
  }

  const pairWithAccount: TransactionWithAccount = {
    id: pair.id,
    bankAccountId: pair.bankAccountId,
    cardId: pair.cardId,
    amount: pair.amount,
    transactionDate: pair.transactionDate,
    transactionType: pair.transactionType,
    description: pair.description,
    counterpartyName: pair.counterpartyName,
    providerTransactionId: pair.providerTransactionId,
    providerStatus: pair.providerStatus,
    internalCategory: pair.internalCategory,
    ruleResolutionStatus: pair.ruleResolutionStatus,
    journalEntryId: pair.journalEntryId,
    ignoredAt: pair.ignoredAt,
    bankAccount: pair.bankAccount,
  };

  const source =
    Number(transaction.amount) < 0 || transaction.transactionType === 'transfer_out'
      ? transaction
      : pairWithAccount;
  const destination = source.id === transaction.id ? pairWithAccount : transaction;

  if (!source.bankAccount.chartOfAccountId || !destination.bankAccount.chartOfAccountId) {
    return { created: false, reason: 'Transfer accounts are missing chart-of-accounts mapping.' };
  }

  const amount = formatAmount(transaction.amount);
  const description = `Internal transfer: ${source.bankAccount.name} → ${destination.bankAccount.name}`;
  const entryDate = entryDateString(transaction.transactionDate);

  return createAndLinkJournalEntry({
    transactionIds: [transaction.id, pairWithAccount.id],
    entryDate,
    description,
    reference: transaction.providerTransactionId,
    lines: [
      {
        accountId: destination.bankAccount.chartOfAccountId,
        debit: amount,
        credit: '0.00',
        description: 'Transfer in',
      },
      {
        accountId: source.bankAccount.chartOfAccountId,
        debit: '0.00',
        credit: amount,
        description: 'Transfer out',
      },
    ],
    metadata: { kind: 'internal_transfer', pairTransactionId: pairWithAccount.id },
  });
}

async function createStandardJournalEntry(
  transaction: TransactionWithAccount,
): Promise<JournalFromTransactionResult> {
  const offsetCode = await resolveOffsetCoaCode(transaction);
  if (!offsetCode) {
    return { created: false, reason: 'No chart-of-accounts code mapped for this category.' };
  }

  const offsetAccountId = await resolveCoaIdByCode(offsetCode);
  const bankAccountId = transaction.bankAccount.chartOfAccountId;
  if (!offsetAccountId || !bankAccountId) {
    return { created: false, reason: 'Required chart-of-accounts accounts were not found.' };
  }

  const amount = formatAmount(transaction.amount);
  const entryDate = entryDateString(transaction.transactionDate);
  const description =
    transaction.description ??
    `${transaction.counterpartyName ?? 'Bank transaction'} (${transaction.internalCategory})`;
  const isInflow = Number(transaction.amount) > 0;

  if (isInflow) {
    return createAndLinkJournalEntry({
      transactionIds: [transaction.id],
      entryDate,
      description,
      reference: transaction.providerTransactionId,
      lines: [
        {
          accountId: bankAccountId,
          debit: amount,
          credit: '0.00',
          description: 'Cash received',
        },
        {
          accountId: offsetAccountId,
          debit: '0.00',
          credit: amount,
          description: 'Offsetting account',
        },
      ],
      metadata: { kind: 'deposit', internalCategory: transaction.internalCategory },
    });
  }

  const creditAccountId = await resolveCreditAccountIdForExpense(transaction);
  if (!creditAccountId) {
    return { created: false, reason: 'Could not resolve credit account for expense.' };
  }

  return createAndLinkJournalEntry({
    transactionIds: [transaction.id],
    entryDate,
    description,
    reference: transaction.providerTransactionId,
    lines: [
      {
        accountId: offsetAccountId,
        debit: amount,
        credit: '0.00',
        description: 'Expense recognized',
      },
      {
        accountId: creditAccountId,
        debit: '0.00',
        credit: amount,
        description: transaction.cardId ? 'Card clearing' : 'Cash paid',
      },
    ],
    metadata: {
      kind: 'expense',
      internalCategory: transaction.internalCategory,
      usedCard: Boolean(transaction.cardId),
    },
  });
}

export async function tryCreateJournalFromBankTransaction(
  transactionId: string,
): Promise<JournalFromTransactionResult> {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
    include: {
      bankAccount: { select: { chartOfAccountId: true, name: true } },
    },
  });

  if (!transaction) {
    return { created: false, reason: 'Transaction not found.' };
  }

  const ineligible = isEligibleForJournal(transaction);
  if (ineligible) {
    return { created: false, reason: ineligible };
  }

  if (transaction.internalCategory === 'internal_transfer') {
    return createTransferJournalEntry(transaction);
  }

  return createStandardJournalEntry(transaction);
}

export async function generateJournalEntriesFromBankTransactions(options: { limit?: number } = {}): Promise<{
  attempted: number;
  created: number;
  skipped: number;
  transferPairs: number;
}> {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 2000);

  const transactions = await prisma.bankTransaction.findMany({
    where: {
      ignoredAt: null,
      journalEntryId: null,
      ruleResolutionStatus: 'processed',
      internalCategory: { not: null },
      providerStatus: 'sent',
      bankAccount: { chartOfAccountId: { not: null } },
    },
    orderBy: [{ transactionDate: 'asc' }],
    take: limit,
    include: {
      bankAccount: { select: { chartOfAccountId: true, name: true } },
    },
  });

  let created = 0;
  let skipped = 0;
  let transferPairs = 0;

  for (const transaction of transactions) {
    const result = await tryCreateJournalFromBankTransaction(transaction.id);
    if (result.created) {
      created += 1;
      if (transaction.internalCategory === 'internal_transfer') {
        transferPairs += 1;
      }
    } else {
      skipped += 1;
    }
  }

  return {
    attempted: transactions.length,
    created,
    skipped,
    transferPairs,
  };
}
