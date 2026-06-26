import { Prisma } from '@prototype/db';
import type {
  BankRuleAction,
  BankRuleCondition,
  BankRuleConditions,
  BankRuleDefinition,
  BankRuleEvaluationContext,
} from '@/src/lib/banking/bank-rule-types';
import { DEFAULT_BANK_RULES } from '@/src/lib/banking/default-bank-rules';
import { tryCreateJournalFromBankTransaction } from '@/src/lib/banking/journal-from-transaction';
import { MERCURY_PROVIDER } from '@/src/lib/mercury/config';
import { prisma } from '@/src/lib/prisma';

type TransactionForRules = {
  id: string;
  bankAccountId: string;
  counterpartyName: string | null;
  description: string | null;
  externalCategory: string | null;
  internalCategory: string | null;
  transactionType: string;
  providerKind: string | null;
  amount: Prisma.Decimal;
  provider: string | null;
  providerStatus: string | null;
  categorySource: string;
  status: string;
  ruleResolutionStatus: string;
  journalEntryId: string | null;
};

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function compareString(actual: string, expected: string, op: BankRuleCondition['op']): boolean {
  const left = normalize(actual);
  const right = normalize(String(expected));
  if (op === 'equals') return left === right;
  if (op === 'contains') return left.includes(right);
  if (op === 'startsWith') return left.startsWith(right);
  return false;
}

function evaluateCondition(condition: BankRuleCondition, context: BankRuleEvaluationContext): boolean {
  const { field, op, value } = condition;

  if (field === 'amount') {
    const amount = context.amount;
    if (op === 'gte') return amount >= Number(value);
    if (op === 'lte') return amount <= Number(value);
    if (op === 'equals') return amount === Number(value);
    return false;
  }

  const actual = context[field] ?? '';
  if (op === 'in') {
    const values = Array.isArray(value) ? value : [String(value)];
    return values.some((candidate) => compareString(String(actual), String(candidate), 'equals'));
  }

  if (op === 'gte' || op === 'lte') {
    return false;
  }

  return compareString(String(actual), String(value), op);
}

function evaluateConditions(conditions: BankRuleConditions, context: BankRuleEvaluationContext): boolean {
  const all = conditions.all ?? [];
  const any = conditions.any ?? [];

  if (all.length > 0 && !all.every((condition) => evaluateCondition(condition, context))) {
    return false;
  }

  if (any.length > 0 && !any.some((condition) => evaluateCondition(condition, context))) {
    return false;
  }

  return all.length > 0 || any.length > 0;
}

function toEvaluationContext(transaction: TransactionForRules): BankRuleEvaluationContext {
  return {
    counterpartyName: transaction.counterpartyName,
    description: transaction.description,
    externalCategory: transaction.externalCategory,
    transactionType: transaction.transactionType,
    providerKind: transaction.providerKind,
    amount: Number(transaction.amount),
    provider: transaction.provider,
  };
}

export async function ensureDefaultBankRules(): Promise<number> {
  let createdOrUpdated = 0;

  for (const rule of DEFAULT_BANK_RULES) {
    const existing = await prisma.bankRule.findFirst({
      where: { ruleName: rule.ruleName },
      select: { id: true },
    });

    const data = {
      ruleName: rule.ruleName,
      priority: rule.priority,
      conditions: rule.conditions as Prisma.InputJsonValue,
      action: rule.action as Prisma.InputJsonValue,
      actions: rule.action as Prisma.InputJsonValue,
      stopProcessing: rule.stopProcessing ?? true,
      isActive: true,
      appliesToProvider: rule.appliesToProvider ?? MERCURY_PROVIDER,
      appliesToAccountId: null,
    };

    if (existing) {
      await prisma.bankRule.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.bankRule.create({ data });
    }
    createdOrUpdated += 1;
  }

  return createdOrUpdated;
}

async function loadActiveRules(bankAccountId: string, provider: string | null) {
  return prisma.bankRule.findMany({
    where: {
      isActive: true,
      AND: [
        provider
          ? { OR: [{ appliesToProvider: null }, { appliesToProvider: provider }] }
          : { appliesToProvider: null },
        { OR: [{ appliesToAccountId: null }, { appliesToAccountId: bankAccountId }] },
      ],
    },
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
  });
}

function shouldSkipRuleProcessing(transaction: TransactionForRules & { ignoredAt?: Date | null }, force: boolean): boolean {
  if (transaction.ignoredAt) return true;
  if (transaction.journalEntryId) return true;
  if (!force && transaction.categorySource === 'manual') return true;
  return false;
}

async function recordRuleMatch(args: {
  bankTransactionId: string;
  bankRuleId: string | null;
  matched: boolean;
  confidence: number | null;
  reason: string | null;
  conditions: Prisma.InputJsonValue;
  actions: Prisma.InputJsonValue;
}) {
  await prisma.bankTransactionRuleMatche.create({
    data: {
      bankTransactionId: args.bankTransactionId,
      bankRuleId: args.bankRuleId,
      matched: args.matched,
      confidence: args.confidence,
      reason: args.reason,
      conditionsSnapshot: args.conditions,
      actionsSnapshot: args.actions,
    },
  });
}

async function ensureReviewTask(transaction: TransactionForRules, reason: string): Promise<void> {
  const isPosted = transaction.providerStatus === 'sent' || transaction.status === 'categorized';
  if (!isPosted) return;

  await prisma.bankTransactionReviewTask.upsert({
    where: { bankTransactionId: transaction.id },
    create: {
      bankTransactionId: transaction.id,
      status: 'open',
      assignedRole: 'super-user',
      reason,
      payload: {
        counterpartyName: transaction.counterpartyName,
        description: transaction.description,
        amount: Number(transaction.amount),
      } as Prisma.InputJsonValue,
    },
    update: {
      status: 'open',
      reason,
      payload: {
        counterpartyName: transaction.counterpartyName,
        description: transaction.description,
        amount: Number(transaction.amount),
      } as Prisma.InputJsonValue,
    },
  });
}

async function clearReviewTask(transactionId: string): Promise<void> {
  await prisma.bankTransactionReviewTask.deleteMany({
    where: { bankTransactionId: transactionId, status: 'open' },
  });
}

export async function applyBankRulesToTransaction(
  transactionId: string,
  options: { force?: boolean } = {},
): Promise<{ matched: boolean; ruleName?: string }> {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    return { matched: false };
  }

  if (shouldSkipRuleProcessing(transaction, options.force ?? false)) {
    return { matched: false };
  }

  const rules = await loadActiveRules(transaction.bankAccountId, transaction.provider);
  const context = toEvaluationContext(transaction);

  for (const rule of rules) {
    const conditions = rule.conditions as BankRuleConditions;
    const action = (rule.actions ?? rule.action) as BankRuleAction;
    const matched = evaluateConditions(conditions, context);

    await recordRuleMatch({
      bankTransactionId: transaction.id,
      bankRuleId: rule.id,
      matched,
      confidence: matched ? action.confidence ?? 80 : null,
      reason: matched ? action.reason ?? rule.ruleName : `No match for ${rule.ruleName}`,
      conditions: conditions as Prisma.InputJsonValue,
      actions: action as Prisma.InputJsonValue,
    });

    if (!matched) continue;

    await prisma.bankTransaction.update({
      where: { id: transaction.id },
      data: {
        internalCategory: action.internalCategory,
        categorySource: 'rule',
        status: 'categorized',
        ruleResolutionStatus: 'processed',
        ruleConfidence: action.confidence ?? 80,
        ruleReason: action.reason ?? rule.ruleName,
      },
    });

    await clearReviewTask(transaction.id);

    if (transaction.providerStatus === 'sent') {
      await tryCreateJournalFromBankTransaction(transaction.id);
    }

    return { matched: true, ruleName: rule.ruleName };
  }

  await prisma.bankTransaction.update({
    where: { id: transaction.id },
    data: {
      ruleResolutionStatus: 'unprocessed',
      ruleConfidence: null,
      ruleReason: 'No active bank rule matched this transaction.',
    },
  });

  await ensureReviewTask(
    transaction,
    'No bank rule matched — review categorization before booking a journal entry.',
  );

  return { matched: false };
}

export async function reprocessUnprocessedBankTransactions(options: { limit?: number } = {}): Promise<{
  processed: number;
  matched: number;
  unmatched: number;
}> {
  const limit = Math.min(Math.max(options.limit ?? 500, 1), 2000);
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      ignoredAt: null,
      journalEntryId: null,
      categorySource: { not: 'manual' },
      OR: [{ ruleResolutionStatus: 'unprocessed' }, { internalCategory: null }],
    },
    orderBy: [{ transactionDate: 'desc' }],
    take: limit,
    select: { id: true },
  });

  let matched = 0;
  let unmatched = 0;

  for (const transaction of transactions) {
    const result = await applyBankRulesToTransaction(transaction.id, { force: true });
    if (result.matched) matched += 1;
    else unmatched += 1;
  }

  return {
    processed: transactions.length,
    matched,
    unmatched,
  };
}
