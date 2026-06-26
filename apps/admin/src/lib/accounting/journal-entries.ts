/**
 * Journal entry service layer (server-only).
 *
 * Handles entry-number allocation, balanced create, post, reverse, soft
 * deletes, and ledger queries (global + per-account). All numeric arithmetic
 * uses Prisma.Decimal via the helpers in `./money`.
 *
 * Entry numbers are opaque UUIDs assigned at create time. See
 * `src/lib/accounting/numbering.ts`.
 */
import 'server-only';

import { Prisma } from '@prototype/db';
import type { JournalEntryStatus } from '@prototype/db';
import { prisma } from '@/src/lib/prisma';
import { round2, sum, toDecimal, toAmountString } from '@/src/lib/accounting/money';
import { allocateOpaqueDocumentNumber } from '@/src/lib/accounting/numbering';
import { collectDescendantIds, loadCoaHierarchy, buildChildrenByParent } from '@/src/lib/accounting/chart-of-accounts';
import { excludeIgnoredBankJournalEntriesFilter } from '@/src/lib/banking/ignored-journal-entry-ids';
import type {
  AccountLedgerQuery,
  JournalEntryCreateInput,
  JournalEntryListQuery,
  JournalEntryUpdateInput,
  LedgerQuery,
} from '@/src/lib/validation/journal-entry';

/* --------------------------------------------------------------------------
 * List + detail
 * ------------------------------------------------------------------------ */

export type JournalEntrySummary = {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string | null;
  reference: string | null;
  status: JournalEntryStatus;
  sourceModule: string | null;
  totalDebits: string;
  totalCredits: string;
  postedAt: string | null;
  reversesEntryId: string | null;
  reversedById: string | null;
  lineCount: number;
};

export type JournalEntryLineDetail = {
  id: string;
  position: number;
  description: string | null;
  debit: string;
  credit: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
};

export type JournalEntryDetail = JournalEntrySummary & {
  createdAt: string | null;
  updatedAt: string | null;
  lines: JournalEntryLineDetail[];
};

function toDateString(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function toEntryDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toSummary(entry: {
  id: string;
  entryNumber: string;
  entryDate: Date;
  description: string | null;
  reference: string | null;
  status: JournalEntryStatus;
  sourceModule: string | null;
  totalDebits: Prisma.Decimal | null;
  totalCredits: Prisma.Decimal | null;
  postedAt: Date | null;
  reversesEntryId: string | null;
  reversedById: string | null;
  _count: { journalEntryLines: number };
}): JournalEntrySummary {
  return {
    id: entry.id,
    entryNumber: entry.entryNumber,
    entryDate: toEntryDateString(entry.entryDate),
    description: entry.description,
    reference: entry.reference,
    status: entry.status,
    sourceModule: entry.sourceModule,
    totalDebits: toAmountString(entry.totalDebits ?? 0),
    totalCredits: toAmountString(entry.totalCredits ?? 0),
    postedAt: toDateString(entry.postedAt),
    reversesEntryId: entry.reversesEntryId,
    reversedById: entry.reversedById,
    lineCount: entry._count.journalEntryLines,
  };
}

export async function listJournalEntries(query: JournalEntryListQuery): Promise<{
  items: JournalEntrySummary[];
  nextCursor: string | null;
}> {
  const where: Prisma.JournalEntryWhereInput = {};
  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }
  if (query.q && query.q.trim().length > 0) {
    const term = query.q.trim();
    where.OR = [
      { entryNumber: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { reference: { contains: term, mode: 'insensitive' } },
      { sourceModule: { contains: term, mode: 'insensitive' } },
    ];
  }

  const take = query.limit + 1;
  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: [{ entryDate: 'desc' }, { entryNumber: 'desc' }],
    include: { _count: { select: { journalEntryLines: true } } },
    take,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
  });

  const hasMore = entries.length > query.limit;
  const sliced = hasMore ? entries.slice(0, query.limit) : entries;
  return {
    items: sliced.map(toSummary),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null,
  };
}

export async function getJournalEntryDetail(id: string): Promise<JournalEntryDetail | null> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      _count: { select: { journalEntryLines: true } },
      journalEntryLines: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
        },
      },
    },
  });
  if (!entry) return null;
  const summary = toSummary(entry);
  return {
    ...summary,
    createdAt: toDateString(entry.createdAt ?? null),
    updatedAt: toDateString(entry.updatedAt ?? null),
    lines: entry.journalEntryLines.map((line, index) => ({
      id: line.id,
      position: line.position ?? index,
      description: line.description,
      debit: toAmountString(line.debit),
      credit: toAmountString(line.credit),
      accountId: line.account.id,
      accountCode: line.account.code,
      accountName: line.account.name,
      accountType: line.account.type,
    })),
  };
}

/* --------------------------------------------------------------------------
 * Mutations: create / delete / post / reverse
 * ------------------------------------------------------------------------ */

export type JournalEntryCreateOptions = {
  status?: JournalEntryStatus;
  postedBy?: string | null;
  sourceModule?: string | null;
  reversesEntryId?: string | null;
  createdBy?: string | null;
};

/**
 * Create a balanced journal entry. The default status is `Draft`; pass
 * `status: 'Posted'` for system-generated entries that should land in the
 * ledger immediately (used by the reversal helper).
 */
export async function createJournalEntry(
  input: JournalEntryCreateInput,
  options: JournalEntryCreateOptions = {},
): Promise<JournalEntryDetail> {
  const lines = input.lines.map((line, index) => ({
    accountId: line.accountId,
    position: index,
    debit: toAmountString(line.debit ?? '0'),
    credit: toAmountString(line.credit ?? '0'),
    description: line.description ?? null,
  }));

  const totalDebits = toAmountString(sum(lines.map((line) => line.debit)));
  const totalCredits = toAmountString(sum(lines.map((line) => line.credit)));
  if (round2(totalDebits).cmp(round2(totalCredits)) !== 0) {
    throw new JournalEntryServiceError(
      'unbalanced',
      `Journal entry not balanced: debits ${totalDebits} vs credits ${totalCredits}.`,
    );
  }

  const status: JournalEntryStatus = options.status ?? 'Draft';
  const postedAt = status === 'Posted' ? new Date() : null;
  const postedBy = status === 'Posted' ? options.postedBy ?? null : null;

  const entryDate = parseEntryDate(input.entryDate);

  const created = await prisma.$transaction(async (tx) => {
    const entryNumber = allocateOpaqueDocumentNumber();
    return tx.journalEntry.create({
      data: {
        entryNumber,
        entryDate,
        description: input.description ?? null,
        reference: input.reference ?? null,
        sourceModule: input.sourceModule ?? options.sourceModule ?? null,
        status,
        totalDebits,
        totalCredits,
        postedAt,
        postedBy,
        reversesEntryId: options.reversesEntryId ?? null,
        createdBy: options.createdBy ?? null,
        updatedBy: options.createdBy ?? null,
        journalEntryLines: {
          create: lines,
        },
      },
      include: {
        _count: { select: { journalEntryLines: true } },
        journalEntryLines: {
          orderBy: [{ position: 'asc' }],
          include: { account: { select: { id: true, code: true, name: true, type: true } } },
        },
      },
    });
  });
  const summary = toSummary(created);
  return {
    ...summary,
    createdAt: toDateString(created.createdAt ?? null),
    updatedAt: toDateString(created.updatedAt ?? null),
    lines: created.journalEntryLines.map((line) => ({
      id: line.id,
      position: line.position ?? 0,
      description: line.description,
      debit: toAmountString(line.debit),
      credit: toAmountString(line.credit),
      accountId: line.account.id,
      accountCode: line.account.code,
      accountName: line.account.name,
      accountType: line.account.type,
    })),
  };
}

function parseEntryDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new JournalEntryServiceError('invalid_date', `Invalid entry date: ${value}.`);
  }
  return parsed;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const entry = await prisma.journalEntry.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!entry) {
    throw new JournalEntryServiceError('not_found', 'Journal entry not found.');
  }
  if (entry.status !== 'Draft') {
    throw new JournalEntryServiceError(
      'invalid_state',
      'Only Draft journal entries can be deleted; post or reverse posted entries instead.',
    );
  }
  await prisma.journalEntry.delete({ where: { id } });
}

export async function updateJournalEntry(
  id: string,
  input: JournalEntryUpdateInput,
): Promise<JournalEntryDetail> {
  const existing = await prisma.journalEntry.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    throw new JournalEntryServiceError('not_found', 'Journal entry not found.');
  }
  if (existing.status !== 'Draft') {
    throw new JournalEntryServiceError(
      'invalid_state',
      'Only Draft journal entries can be edited.',
    );
  }

  const entryDate = input.entryDate ? parseEntryDate(input.entryDate) : undefined;
  const lines = input.lines?.map((line, index) => ({
    accountId: line.accountId,
    position: index,
    debit: toAmountString(line.debit ?? '0'),
    credit: toAmountString(line.credit ?? '0'),
    description: line.description ?? null,
  }));

  if (lines) {
    const totalDebits = toAmountString(sum(lines.map((line) => line.debit)));
    const totalCredits = toAmountString(sum(lines.map((line) => line.credit)));
    if (round2(totalDebits).cmp(round2(totalCredits)) !== 0) {
      throw new JournalEntryServiceError(
        'unbalanced',
        `Journal entry not balanced: debits ${totalDebits} vs credits ${totalCredits}.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.journalEntryLine.deleteMany({ where: { journalEntryId: id } });
      await tx.journalEntry.update({
        where: { id },
        data: {
          ...(entryDate ? { entryDate } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.reference !== undefined ? { reference: input.reference } : {}),
          ...(input.sourceModule !== undefined ? { sourceModule: input.sourceModule } : {}),
          totalDebits,
          totalCredits,
        },
      });
      await tx.journalEntryLine.createMany({
        data: lines.map((line) => ({
          journalEntryId: id,
          accountId: line.accountId,
          position: line.position,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })),
      });
    });
  } else {
    await prisma.journalEntry.update({
      where: { id },
      data: {
        ...(entryDate ? { entryDate } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.reference !== undefined ? { reference: input.reference } : {}),
        ...(input.sourceModule !== undefined ? { sourceModule: input.sourceModule } : {}),
      },
    });
  }

  const detail = await getJournalEntryDetail(id);
  if (!detail) {
    throw new JournalEntryServiceError('not_found', 'Journal entry disappeared after update.');
  }
  return detail;
}

export async function postJournalEntry(
  id: string,
  options: { postedBy?: string | null } = {},
): Promise<JournalEntryDetail> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      _count: { select: { journalEntryLines: true } },
      journalEntryLines: { select: { debit: true, credit: true } },
    },
  });
  if (!entry) {
    throw new JournalEntryServiceError('not_found', 'Journal entry not found.');
  }
  if (entry.status !== 'Draft') {
    throw new JournalEntryServiceError(
      'invalid_state',
      `Journal entry is ${entry.status}; only Draft entries can be posted.`,
    );
  }
  if (entry.journalEntryLines.length < 2) {
    throw new JournalEntryServiceError('invalid_state', 'A journal entry needs at least two lines.');
  }
  const totalDebits = sum(entry.journalEntryLines.map((line) => line.debit ?? 0));
  const totalCredits = sum(entry.journalEntryLines.map((line) => line.credit ?? 0));
  if (round2(totalDebits).cmp(round2(totalCredits)) !== 0) {
    throw new JournalEntryServiceError(
      'unbalanced',
      `Journal entry not balanced: debits ${totalDebits.toFixed(2)} vs credits ${totalCredits.toFixed(2)}.`,
    );
  }

  await prisma.journalEntry.update({
    where: { id },
    data: {
      status: 'Posted',
      postedAt: new Date(),
      postedBy: options.postedBy ?? null,
      totalDebits: toAmountString(totalDebits),
      totalCredits: toAmountString(totalCredits),
      updatedBy: options.postedBy ?? null,
    },
  });

  const detail = await getJournalEntryDetail(id);
  if (!detail) {
    throw new JournalEntryServiceError('not_found', 'Journal entry disappeared after posting.');
  }
  return detail;
}

/**
 * Reverse a Posted journal entry by creating a new Posted journal entry with
 * debits/credits swapped and linking the two via `reversesEntryId` / 
 * `reversedById`. The original entry's status moves to `Reversed`.
 *
 * Status choice: we deliberately create the reversal as `Posted`, not `Draft`,
 * so that the ledger immediately reflects the reversal. Bookkeepers can still
 * inspect the reversing entry and reverse it again if needed, but treating it
 * as a Draft would leave the original entry's effect on the books until
 * someone manually posted the reversal — a common source of accounting errors.
 */
export async function reverseJournalEntry(
  id: string,
  options: { reversalDate?: string; description?: string | null; postedBy?: string | null } = {},
): Promise<{ original: JournalEntryDetail; reversal: JournalEntryDetail }> {
  const original = await prisma.journalEntry.findUnique({
    where: { id },
    include: {
      journalEntryLines: {
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { accountId: true, debit: true, credit: true, description: true, position: true },
      },
    },
  });
  if (!original) {
    throw new JournalEntryServiceError('not_found', 'Journal entry not found.');
  }
  if (original.status !== 'Posted') {
    throw new JournalEntryServiceError(
      'invalid_state',
      `Only Posted journal entries can be reversed (current status: ${original.status}).`,
    );
  }
  if (original.reversedById) {
    throw new JournalEntryServiceError(
      'already_reversed',
      `Journal entry was already reversed by ${original.reversedById}.`,
    );
  }

  const reversalDate = options.reversalDate ?? toEntryDateString(new Date());
  const description =
    options.description ?? `Reversal of ${original.entryNumber}${original.description ? ` — ${original.description}` : ''}`;

  const reversal = await createJournalEntry(
    {
      entryDate: reversalDate,
      description,
      reference: original.reference ?? null,
      sourceModule: original.sourceModule ?? null,
      lines: original.journalEntryLines.map((line) => ({
        accountId: line.accountId,
        description: line.description,
        debit: toAmountString(line.credit ?? 0),
        credit: toAmountString(line.debit ?? 0),
      })),
    },
    {
      status: 'Posted',
      postedBy: options.postedBy ?? null,
      reversesEntryId: original.id,
      createdBy: options.postedBy ?? null,
      sourceModule: 'reversal',
    },
  );

  await prisma.journalEntry.update({
    where: { id: original.id },
    data: {
      status: 'Reversed',
      reversedById: reversal.id,
      updatedBy: options.postedBy ?? null,
    },
  });

  const updatedOriginal = await getJournalEntryDetail(original.id);
  if (!updatedOriginal) {
    throw new JournalEntryServiceError('not_found', 'Journal entry disappeared after reversal.');
  }
  return { original: updatedOriginal, reversal };
}

/* --------------------------------------------------------------------------
 * Ledger queries
 * ------------------------------------------------------------------------ */

export type LedgerLine = {
  id: string;
  entryId: string;
  entryNumber: string;
  entryDate: string;
  position: number;
  description: string | null;
  entryDescription: string | null;
  reference: string | null;
  sourceModule: string | null;
  status: JournalEntryStatus;
  debit: string;
  credit: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
};

function statusFilterForLedger(status: LedgerQuery['status']): JournalEntryStatus[] {
  if (status && status !== 'all') {
    return [status];
  }
  return ['Draft', 'Posted', 'Reversed'];
}

export async function listGlobalLedger(query: LedgerQuery): Promise<{
  items: LedgerLine[];
  nextCursor: string | null;
}> {
  const statuses = statusFilterForLedger(query.status);
  const entryDateFilter: Prisma.DateTimeFilter = {};
  if (query.from) entryDateFilter.gte = new Date(`${query.from}T00:00:00.000Z`);
  if (query.to) entryDateFilter.lte = new Date(`${query.to}T23:59:59.999Z`);
  const ignoredJournalFilter = await excludeIgnoredBankJournalEntriesFilter();

  const where: Prisma.JournalEntryLineWhereInput = {
    journalEntry: {
      is: {
        status: { in: statuses },
        ...ignoredJournalFilter,
        ...(query.from || query.to ? { entryDate: entryDateFilter } : {}),
        ...(query.sourceModule ? { sourceModule: query.sourceModule } : {}),
        ...(query.q && query.q.trim().length > 0
          ? {
              OR: [
                { entryNumber: { contains: query.q.trim(), mode: 'insensitive' } },
                { description: { contains: query.q.trim(), mode: 'insensitive' } },
                { reference: { contains: query.q.trim(), mode: 'insensitive' } },
              ],
            }
          : {}),
      },
    },
    ...(query.accountId ? { accountId: query.accountId } : {}),
  };

  const take = query.limit + 1;
  const lines = await prisma.journalEntryLine.findMany({
    where,
    orderBy: [
      { journalEntry: { entryDate: 'desc' } },
      { journalEntry: { entryNumber: 'desc' } },
      { position: 'asc' },
    ],
    include: {
      account: { select: { id: true, code: true, name: true, type: true } },
      journalEntry: {
        select: {
          id: true,
          entryNumber: true,
          entryDate: true,
          description: true,
          reference: true,
          sourceModule: true,
          status: true,
        },
      },
    },
    take,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
  });

  const hasMore = lines.length > query.limit;
  const sliced = hasMore ? lines.slice(0, query.limit) : lines;
  return {
    items: sliced.map((line) => ({
      id: line.id,
      entryId: line.journalEntry.id,
      entryNumber: line.journalEntry.entryNumber,
      entryDate: toEntryDateString(line.journalEntry.entryDate),
      position: line.position ?? 0,
      description: line.description,
      entryDescription: line.journalEntry.description,
      reference: line.journalEntry.reference,
      sourceModule: line.journalEntry.sourceModule,
      status: line.journalEntry.status,
      debit: toAmountString(line.debit),
      credit: toAmountString(line.credit),
      accountId: line.account.id,
      accountCode: line.account.code,
      accountName: line.account.name,
      accountType: line.account.type,
    })),
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null,
  };
}

/* --------------------------------------------------------------------------
 * Per-account ledger with running balance
 * ------------------------------------------------------------------------ */

export type AccountLedgerLine = LedgerLine & {
  /** Signed amount applied to this account on this line (debit - credit for
   *  debit-natural accounts, credit - debit for credit-natural). */
  delta: string;
  /** Running balance after applying this line, in the account's natural sign. */
  runningBalance: string;
};

export type AccountSummary = {
  id: string;
  code: string;
  name: string;
  type: string;
  subType: string | null;
  description: string | null;
  isActive: boolean;
  parentId: string | null;
  hasChildren: boolean;
};

export type AccountLedgerPayload = {
  account: AccountSummary;
  openingBalance: string;
  closingBalance: string;
  periodDebits: string;
  periodCredits: string;
  lines: AccountLedgerLine[];
  nextCursor: string | null;
  from: string | null;
  to: string | null;
};

export function isDebitNatural(type: string): boolean {
  return type === 'asset' || type === 'expense';
}

export async function getAccountSummary(accountId: string): Promise<AccountSummary | null> {
  const account = await prisma.chartOfAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      subType: true,
      description: true,
      isActive: true,
      parentId: true,
      _count: { select: { childAccounts: true } },
    },
  });
  if (!account) return null;
  return {
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    subType: account.subType,
    description: account.description,
    isActive: account.isActive,
    parentId: account.parentId,
    hasChildren: account._count.childAccounts > 0,
  };
}

export async function getAccountLedger(
  accountId: string,
  query: AccountLedgerQuery,
): Promise<AccountLedgerPayload | null> {
  const account = await getAccountSummary(accountId);
  if (!account) return null;

  const hierarchy = await loadCoaHierarchy();
  const childrenByParent = buildChildrenByParent(hierarchy);
  const descendantIds = collectDescendantIds(accountId, childrenByParent);
  const accountScope = [accountId, ...descendantIds];

  const debitNatural = isDebitNatural(account.type);
  const fromDate = query.from ? new Date(`${query.from}T00:00:00.000Z`) : null;
  const toDate = query.to ? new Date(`${query.to}T23:59:59.999Z`) : null;
  const ignoredJournalFilter = await excludeIgnoredBankJournalEntriesFilter();

  const openingRaw = fromDate
    ? await prisma.journalEntryLine.aggregate({
        where: {
          accountId: { in: accountScope },
          journalEntry: {
            is: {
              status: { in: ['Posted', 'Reversed'] },
              entryDate: { lt: fromDate },
              ...ignoredJournalFilter,
            },
          },
        },
        _sum: { debit: true, credit: true },
      })
    : { _sum: { debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(0) } };

  const openingDebits = openingRaw._sum.debit ?? new Prisma.Decimal(0);
  const openingCredits = openingRaw._sum.credit ?? new Prisma.Decimal(0);
  const openingSigned = debitNatural
    ? toDecimal(openingDebits).sub(toDecimal(openingCredits))
    : toDecimal(openingCredits).sub(toDecimal(openingDebits));

  const where: Prisma.JournalEntryLineWhereInput = {
    accountId: { in: accountScope },
    journalEntry: {
      is: {
        status: { in: ['Posted', 'Reversed'] },
        ...ignoredJournalFilter,
        ...(fromDate || toDate
          ? {
              entryDate: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            }
          : {}),
      },
    },
  };

  const take = query.limit + 1;
  const lines = await prisma.journalEntryLine.findMany({
    where,
    orderBy: [
      { journalEntry: { entryDate: 'asc' } },
      { journalEntry: { entryNumber: 'asc' } },
      { position: 'asc' },
    ],
    include: {
      account: { select: { id: true, code: true, name: true, type: true } },
      journalEntry: {
        select: {
          id: true,
          entryNumber: true,
          entryDate: true,
          description: true,
          reference: true,
          sourceModule: true,
          status: true,
        },
      },
    },
    take,
    ...(query.cursor ? { skip: 1, cursor: { id: query.cursor } } : {}),
  });

  const hasMore = lines.length > query.limit;
  const sliced = hasMore ? lines.slice(0, query.limit) : lines;

  let running = openingSigned;
  const ledgerLines: AccountLedgerLine[] = sliced.map((line) => {
    const debit = toDecimal(line.debit);
    const credit = toDecimal(line.credit);
    const delta = debitNatural ? debit.sub(credit) : credit.sub(debit);
    running = running.add(delta);
    return {
      id: line.id,
      entryId: line.journalEntry.id,
      entryNumber: line.journalEntry.entryNumber,
      entryDate: toEntryDateString(line.journalEntry.entryDate),
      position: line.position ?? 0,
      description: line.description,
      entryDescription: line.journalEntry.description,
      reference: line.journalEntry.reference,
      sourceModule: line.journalEntry.sourceModule,
      status: line.journalEntry.status,
      debit: toAmountString(debit),
      credit: toAmountString(credit),
      accountId: line.account.id,
      accountCode: line.account.code,
      accountName: line.account.name,
      accountType: line.account.type,
      delta: toAmountString(delta),
      runningBalance: toAmountString(running),
    };
  });

  // Period totals for the header card (independent of cursor pagination).
  const periodTotals = await prisma.journalEntryLine.aggregate({
    where,
    _sum: { debit: true, credit: true },
  });
  const periodDebits = toAmountString(periodTotals._sum.debit ?? 0);
  const periodCredits = toAmountString(periodTotals._sum.credit ?? 0);
  const closingSigned = debitNatural
    ? openingSigned.add(toDecimal(periodTotals._sum.debit ?? 0)).sub(toDecimal(periodTotals._sum.credit ?? 0))
    : openingSigned.add(toDecimal(periodTotals._sum.credit ?? 0)).sub(toDecimal(periodTotals._sum.debit ?? 0));

  return {
    account,
    openingBalance: toAmountString(openingSigned),
    closingBalance: toAmountString(closingSigned),
    periodDebits,
    periodCredits,
    lines: ledgerLines,
    nextCursor: hasMore ? sliced[sliced.length - 1]?.id ?? null : null,
    from: query.from ?? null,
    to: query.to ?? null,
  };
}

/* --------------------------------------------------------------------------
 * Account search (for the combobox)
 * ------------------------------------------------------------------------ */

export type AccountOption = {
  id: string;
  code: string;
  name: string;
  type: string;
};

export async function listAccountsForPicker(): Promise<AccountOption[]> {
  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true, type: true },
    orderBy: [{ code: 'asc' }],
  });
  return accounts.map((account) => ({
    id: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
  }));
}

/* --------------------------------------------------------------------------
 * Errors
 * ------------------------------------------------------------------------ */

export type JournalEntryServiceErrorCode =
  | 'not_found'
  | 'invalid_state'
  | 'unbalanced'
  | 'invalid_date'
  | 'already_reversed';

export class JournalEntryServiceError extends Error {
  readonly code: JournalEntryServiceErrorCode;
  constructor(code: JournalEntryServiceErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'JournalEntryServiceError';
  }
}

export function serviceErrorStatus(code: JournalEntryServiceErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'invalid_state':
    case 'already_reversed':
    case 'invalid_date':
      return 409;
    case 'unbalanced':
      return 400;
    default:
      return 400;
  }
}
