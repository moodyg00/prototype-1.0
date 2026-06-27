import { Prisma } from '@prototype/db';
import {
  getMercuryTransaction,
  listMercuryAccountCards,
  listMercuryAccountTransactions,
  listMercuryAccounts,
  MercuryApiError,
} from '../mercury/client';
import {
  MERCURY_DEMO_ACCOUNT_ID_PREFIX,
  MERCURY_DEMO_CARD_ID_PREFIX,
  MERCURY_DEMO_TRANSACTION_ID_PREFIX,
  MERCURY_PROVIDER,
  MERCURY_TRANSACTION_BACKFILL_START,
} from '../mercury/config';
import {
  centsFromBalance,
  coaCodeForMercuryAccountKind,
  externalCategory,
  formatAmount,
  isMercuryDepositoryAccount,
  mapMercuryAccountType,
  mapMercuryCardStatus,
  mapTransactionDate,
  mapTransactionType,
  merchantDisplayName,
  merchantInitials,
  mercuryCardLabel,
  mercuryProviderCardId,
  normalizeMerchantName,
  transactionDescription,
  transactionReference,
} from '../mercury/mappers';
import type { MercuryAccount, MercuryAccountCard, MercuryTransaction } from '../mercury/types';
import {
  applyBankRulesToTransaction,
  ensureDefaultBankRules,
  reprocessUnprocessedBankTransactions,
} from './apply-bank-rules';
import { generateJournalEntriesFromBankTransactions } from './journal-from-transaction';
import { logIntegrationEvent } from '../integrations/log-integration-event';
import { getAccountingPrisma } from '../db';

export type MercurySyncResult = {
  accountsSynced: number;
  cardsSynced: number;
  transactionsSynced: number;
  merchantsSynced: number;
  rulesEnsured: number;
  rulesMatched: number;
  rulesUnmatched: number;
  journalEntriesCreated: number;
  demoRowsRemoved: number;
  startedAt: string;
  finishedAt: string;
};

const WEBHOOK_EVENT_OPERATION = 'webhook_event';

async function logSyncAttempt(args: {
  operation: string;
  targetResourceId?: string | null;
  responseStatus?: number | null;
  requestId?: string | null;
  durationMs?: number | null;
  succeeded: boolean;
  errorMessage?: string | null;
}) {
  await getAccountingPrisma().bankSyncAuditLog.create({
    data: {
      provider: MERCURY_PROVIDER,
      operation: args.operation,
      targetResourceId: args.targetResourceId ?? null,
      responseStatus: args.responseStatus ?? null,
      requestId: args.requestId ?? null,
      durationMs: args.durationMs ?? null,
      succeeded: args.succeeded,
      errorMessage: args.errorMessage ?? null,
    },
  });

  if (!args.succeeded) {
    try {
      await logIntegrationEvent({
        provider: MERCURY_PROVIDER,
        logType: 'sync',
        status: 'failed',
        endpoint: args.operation,
        errorMessage: args.errorMessage ?? null,
        durationMs: args.durationMs ?? null,
        requestPayload: {
          operation: args.operation,
          targetResourceId: args.targetResourceId ?? null,
          responseStatus: args.responseStatus ?? null,
          requestId: args.requestId ?? null,
        },
      });
    } catch {
      // Integration logging must not block bank sync.
    }
  }
}

async function resolveCoaId(code: string): Promise<string | null> {
  const account = await getAccountingPrisma().chartOfAccount.findFirst({
    where: { code, isActive: true },
    select: { id: true },
  });
  return account?.id ?? null;
}

async function resolveLocalCardId(providerCardId: string | null): Promise<string | null> {
  if (!providerCardId) return null;
  const card = await getAccountingPrisma().bankCard.findUnique({
    where: {
      provider_providerCardId: {
        provider: MERCURY_PROVIDER,
        providerCardId,
      },
    },
    select: { id: true },
  });
  return card?.id ?? null;
}

export async function removeMercuryDemoSeedRows(): Promise<number> {
  const demoAccounts = await getAccountingPrisma().bankAccount.findMany({
    where: {
      provider: MERCURY_PROVIDER,
      providerAccountId: { startsWith: MERCURY_DEMO_ACCOUNT_ID_PREFIX },
    },
    select: { id: true },
  });
  const demoAccountIds = demoAccounts.map((row) => row.id);

  const [txResult, cardResult, accountResult] = await getAccountingPrisma().$transaction([
    getAccountingPrisma().bankTransaction.deleteMany({
      where: {
        OR: [
          { provider: MERCURY_PROVIDER, providerTransactionId: { startsWith: MERCURY_DEMO_TRANSACTION_ID_PREFIX } },
          ...(demoAccountIds.length > 0 ? [{ bankAccountId: { in: demoAccountIds } }] : []),
        ],
      },
    }),
    getAccountingPrisma().bankCard.deleteMany({
      where: {
        provider: MERCURY_PROVIDER,
        providerCardId: { startsWith: MERCURY_DEMO_CARD_ID_PREFIX },
      },
    }),
    getAccountingPrisma().bankAccount.deleteMany({
      where: {
        provider: MERCURY_PROVIDER,
        providerAccountId: { startsWith: MERCURY_DEMO_ACCOUNT_ID_PREFIX },
      },
    }),
  ]);

  return txResult.count + cardResult.count + accountResult.count;
}

async function upsertMercuryAccount(account: MercuryAccount, syncedAt: Date): Promise<void> {
  const coaCode = coaCodeForMercuryAccountKind(account.kind);
  const chartOfAccountId = coaCode ? await resolveCoaId(coaCode) : null;
  const accountType = mapMercuryAccountType(account.kind);
  const last4 = account.accountNumber?.slice(-4) ?? null;

  await getAccountingPrisma().bankAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: MERCURY_PROVIDER,
        providerAccountId: account.id,
      },
    },
    create: {
      name: account.nickname?.trim() || account.name,
      accountType,
      chartOfAccountId,
      bankName: 'Mercury',
      provider: MERCURY_PROVIDER,
      providerAccountId: account.id,
      lastSyncedAt: syncedAt,
      accountNumberLast4: last4,
      routingNumberLast4: account.routingNumber?.slice(-4) ?? null,
      availableBalanceCents: centsFromBalance(account.availableBalance),
      currentBalanceCents: centsFromBalance(account.currentBalance),
      status: account.status,
      dashboardLink: account.dashboardLink,
      providerRawPayload: account as unknown as Prisma.InputJsonValue,
      currency: 'USD',
      currentBalance: formatAmount(account.currentBalance),
      isActive: account.status === 'active',
    },
    update: {
      name: account.nickname?.trim() || account.name,
      accountType,
      chartOfAccountId: chartOfAccountId ?? undefined,
      lastSyncedAt: syncedAt,
      accountNumberLast4: last4,
      routingNumberLast4: account.routingNumber?.slice(-4) ?? null,
      availableBalanceCents: centsFromBalance(account.availableBalance),
      currentBalanceCents: centsFromBalance(account.currentBalance),
      status: account.status,
      dashboardLink: account.dashboardLink,
      providerRawPayload: account as unknown as Prisma.InputJsonValue,
      currentBalance: formatAmount(account.currentBalance),
      isActive: account.status === 'active',
    },
  });
}

async function upsertMercuryCard(bankAccountId: string, card: MercuryAccountCard, syncedAt: Date): Promise<void> {
  const limitAmount = card.spendLimit.amountCents / 100;

  await getAccountingPrisma().bankCard.upsert({
    where: {
      provider_providerCardId: {
        provider: MERCURY_PROVIDER,
        providerCardId: card.cardId,
      },
    },
    create: {
      cardName: mercuryCardLabel(card),
      last4: card.lastFourDigits,
      provider: MERCURY_PROVIDER,
      providerCardId: card.cardId,
      lastSyncedAt: syncedAt,
      network: card.network,
      cardType: card.type,
      spendLimitAmountCents: BigInt(card.spendLimit.amountCents),
      spendLimitInterval: card.spendLimit.interval,
      providerRawPayload: card as unknown as Prisma.InputJsonValue,
      bankAccountId,
      dailyLimit: card.spendLimit.interval === 'daily' ? formatAmount(limitAmount) : null,
      status: mapMercuryCardStatus(card.status),
    },
    update: {
      cardName: mercuryCardLabel(card),
      last4: card.lastFourDigits,
      lastSyncedAt: syncedAt,
      network: card.network,
      cardType: card.type,
      spendLimitAmountCents: BigInt(card.spendLimit.amountCents),
      spendLimitInterval: card.spendLimit.interval,
      providerRawPayload: card as unknown as Prisma.InputJsonValue,
      bankAccountId,
      dailyLimit: card.spendLimit.interval === 'daily' ? formatAmount(limitAmount) : null,
      status: mapMercuryCardStatus(card.status),
    },
  });
}

async function upsertMerchant(tx: MercuryTransaction): Promise<string | null> {
  const displayName = merchantDisplayName(tx);
  const normalizedName = normalizeMerchantName(displayName);

  const merchant = await getAccountingPrisma().bankMerchant.upsert({
    where: { normalizedName },
    create: {
      displayName,
      normalizedName,
      avatarInitials: merchantInitials(displayName),
      avatarColor: '#334155',
      metadata: {
        source: MERCURY_PROVIDER,
        counterpartyId: tx.counterpartyId ?? null,
      } as Prisma.InputJsonValue,
    },
    update: {
      displayName,
      metadata: {
        source: MERCURY_PROVIDER,
        counterpartyId: tx.counterpartyId ?? null,
      } as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return merchant.id;
}

async function upsertTransaction(
  bankAccountId: string,
  tx: MercuryTransaction,
  merchantId: string | null,
): Promise<string> {
  const now = new Date();
  const amount = formatAmount(tx.amount);
  const cardId = await resolveLocalCardId(mercuryProviderCardId(tx));
  const data = {
    bankAccountId,
    cardId,
    merchantId,
    provider: MERCURY_PROVIDER,
    providerTransactionId: tx.id,
    lastSyncedAt: now,
    providerStatus: tx.status,
    providerKind: tx.kind,
    counterpartyName: tx.counterpartyName,
    postedAt: tx.postedAt ? new Date(tx.postedAt) : null,
    mercuryRequestId: tx.requestId ?? null,
    dashboardLink: tx.dashboardLink,
    providerRawPayload: tx as unknown as Prisma.InputJsonValue,
    transactionDate: mapTransactionDate(tx),
    amount,
    transactionType: mapTransactionType(tx),
    description: transactionDescription(tx),
    reference: transactionReference(tx),
    externalCategory: externalCategory(tx),
    categorySource: 'mercury',
    status: 'pending',
    ruleResolutionStatus: 'unprocessed',
    llmReviewStatus: 'not_requested',
  };

  const saved = await getAccountingPrisma().bankTransaction.upsert({
    where: {
      provider_providerTransactionId: {
        provider: MERCURY_PROVIDER,
        providerTransactionId: tx.id,
      },
    },
    create: data,
    update: {
      bankAccountId,
      cardId,
      merchantId,
      lastSyncedAt: now,
      providerStatus: tx.status,
      providerKind: tx.kind,
      counterpartyName: tx.counterpartyName,
      postedAt: tx.postedAt ? new Date(tx.postedAt) : null,
      mercuryRequestId: tx.requestId ?? null,
      dashboardLink: tx.dashboardLink,
      providerRawPayload: tx as unknown as Prisma.InputJsonValue,
      transactionDate: mapTransactionDate(tx),
      amount,
      transactionType: mapTransactionType(tx),
      description: transactionDescription(tx),
      reference: transactionReference(tx),
      externalCategory: externalCategory(tx),
    },
    select: { id: true, categorySource: true, ruleResolutionStatus: true },
  });

  if (saved.categorySource === 'mercury' || saved.ruleResolutionStatus === 'unprocessed') {
    await applyBankRulesToTransaction(saved.id);
  }

  return saved.id;
}

async function getLocalMercuryAccounts() {
  return getAccountingPrisma().bankAccount.findMany({
    where: { provider: MERCURY_PROVIDER, isActive: true },
    select: { id: true, providerAccountId: true },
  });
}

export async function wasMercuryWebhookEventProcessed(eventId: string): Promise<boolean> {
  const existing = await getAccountingPrisma().bankSyncAuditLog.findFirst({
    where: {
      provider: MERCURY_PROVIDER,
      operation: WEBHOOK_EVENT_OPERATION,
      targetResourceId: eventId,
      succeeded: true,
    },
    select: { id: true },
  });
  return Boolean(existing);
}

export async function markMercuryWebhookEventProcessed(eventId: string, resourceType: string): Promise<void> {
  await logSyncAttempt({
    operation: WEBHOOK_EVENT_OPERATION,
    targetResourceId: eventId,
    succeeded: true,
    errorMessage: resourceType,
  });
}

export async function refreshMercuryAccountBalances(providerAccountId: string): Promise<void> {
  const mercuryAccounts = (await listMercuryAccounts()).filter(isMercuryDepositoryAccount);
  const account = mercuryAccounts.find((row) => row.id === providerAccountId);
  if (!account) return;
  await upsertMercuryAccount(account, new Date());
}

export async function syncMercuryTransactionByProviderId(providerTransactionId: string): Promise<void> {
  const tx = await getMercuryTransaction(providerTransactionId);
  const localAccount = await getAccountingPrisma().bankAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: MERCURY_PROVIDER,
        providerAccountId: tx.accountId,
      },
    },
    select: { id: true },
  });
  if (!localAccount) {
    const mercuryAccount = (await listMercuryAccounts()).find((row) => row.id === tx.accountId);
    if (mercuryAccount) {
      await upsertMercuryAccount(mercuryAccount, new Date());
    }
  }
  const account = await getAccountingPrisma().bankAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: MERCURY_PROVIDER,
        providerAccountId: tx.accountId,
      },
    },
    select: { id: true },
  });
  if (!account) return;

  const merchantId = await upsertMerchant(tx);
  await upsertTransaction(account.id, tx, merchantId);
}

async function finalizeRuleProcessing(): Promise<{
  rulesEnsured: number;
  rulesMatched: number;
  rulesUnmatched: number;
  journalEntriesCreated: number;
}> {
  const rulesEnsured = await ensureDefaultBankRules();
  const reprocess = await reprocessUnprocessedBankTransactions();
  const journals = await generateJournalEntriesFromBankTransactions();
  return {
    rulesEnsured,
    rulesMatched: reprocess.matched,
    rulesUnmatched: reprocess.unmatched,
    journalEntriesCreated: journals.created,
  };
}

function recentTransactionStartDate(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 14);
  return date.toISOString().slice(0, 10);
}

type SyncOptions = {
  removeDemoSeed?: boolean;
  transactionStart?: string;
};

async function runMercurySync(options: SyncOptions = {}): Promise<MercurySyncResult> {
  const startedAt = new Date();
  let demoRowsRemoved = 0;
  let accountsSynced = 0;
  let cardsSynced = 0;
  let transactionsSynced = 0;
  let merchantsSynced = 0;
  let rulesEnsured = 0;
  let rulesMatched = 0;
  let rulesUnmatched = 0;
  let journalEntriesCreated = 0;

  if (options.removeDemoSeed ?? false) {
    demoRowsRemoved = await removeMercuryDemoSeedRows();
  }

  const mercuryAccounts = (await listMercuryAccounts()).filter(isMercuryDepositoryAccount);
  const syncedAt = new Date();

  for (const account of mercuryAccounts) {
    await upsertMercuryAccount(account, syncedAt);
    accountsSynced += 1;
  }

  const localAccounts = await getLocalMercuryAccounts();
  const merchantIds = new Set<string>();

  for (const localAccount of localAccounts) {
    if (!localAccount.providerAccountId) continue;

    const cards = await listMercuryAccountCards(localAccount.providerAccountId);
    for (const card of cards) {
      await upsertMercuryCard(localAccount.id, card, syncedAt);
      cardsSynced += 1;
    }

    const transactions = await listMercuryAccountTransactions(localAccount.providerAccountId, {
      start: options.transactionStart ?? MERCURY_TRANSACTION_BACKFILL_START,
    });

    for (const tx of transactions) {
      const merchantId = await upsertMerchant(tx);
      if (merchantId) merchantIds.add(merchantId);
      await upsertTransaction(localAccount.id, tx, merchantId);
      transactionsSynced += 1;
    }
  }

  merchantsSynced = merchantIds.size;

  const ruleResult = await finalizeRuleProcessing();
  rulesEnsured = ruleResult.rulesEnsured;
  rulesMatched = ruleResult.rulesMatched;
  rulesUnmatched = ruleResult.rulesUnmatched;
  journalEntriesCreated = ruleResult.journalEntriesCreated;

  const finishedAt = new Date();

  return {
    accountsSynced,
    cardsSynced,
    transactionsSynced,
    merchantsSynced,
    rulesEnsured,
    rulesMatched,
    rulesUnmatched,
    journalEntriesCreated,
    demoRowsRemoved,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
  };
}

export async function syncMercuryBankData(options: { removeDemoSeed?: boolean } = {}): Promise<MercurySyncResult> {
  const startedAt = Date.now();
  try {
    const result = await runMercurySync({
      removeDemoSeed: options.removeDemoSeed ?? true,
      transactionStart: MERCURY_TRANSACTION_BACKFILL_START,
    });
    await logSyncAttempt({
      operation: 'full_sync',
      succeeded: true,
      durationMs: Date.now() - startedAt,
      targetResourceId: `${result.accountsSynced} accounts, ${result.cardsSynced} cards`,
    });
    return result;
  } catch (error) {
    const mercuryError = error instanceof MercuryApiError ? error : null;
    await logSyncAttempt({
      operation: 'full_sync',
      succeeded: false,
      durationMs: Date.now() - startedAt,
      responseStatus: mercuryError?.status ?? null,
      requestId: mercuryError?.requestId ?? null,
      errorMessage: error instanceof Error ? error.message : 'Unknown sync error',
    });
    throw error;
  }
}

export async function syncMercuryBankDataIncremental(): Promise<MercurySyncResult> {
  const startedAt = Date.now();
  try {
    const result = await runMercurySync({
      removeDemoSeed: false,
      transactionStart: recentTransactionStartDate(),
    });
    await logSyncAttempt({
      operation: 'incremental_sync',
      succeeded: true,
      durationMs: Date.now() - startedAt,
      targetResourceId: `${result.transactionsSynced} transactions`,
    });
    return result;
  } catch (error) {
    const mercuryError = error instanceof MercuryApiError ? error : null;
    await logSyncAttempt({
      operation: 'incremental_sync',
      succeeded: false,
      durationMs: Date.now() - startedAt,
      responseStatus: mercuryError?.status ?? null,
      requestId: mercuryError?.requestId ?? null,
      errorMessage: error instanceof Error ? error.message : 'Unknown sync error',
    });
    throw error;
  }
}
