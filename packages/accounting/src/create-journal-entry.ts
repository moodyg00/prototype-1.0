import type { JournalEntryStatus, Prisma } from '@prototype/db';

import { getAccountingPrisma } from './db';
import { round2, sum, toAmountString } from './money';
import { allocateOpaqueDocumentNumber } from './numbering';

export class JournalEntryServiceError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'JournalEntryServiceError';
  }
}

export type JournalEntryLineInput = {
  accountId: string;
  debit?: string | number;
  credit?: string | number;
  description?: string | null;
};

export type JournalEntryCreateInput = {
  entryDate: string;
  description?: string | null;
  reference?: string | null;
  sourceModule?: string | null;
  lines: JournalEntryLineInput[];
};

export type JournalEntryCreateOptions = {
  status?: JournalEntryStatus;
  sourceModule?: string | null;
  postedBy?: string | null;
  reversesEntryId?: string | null;
  createdBy?: string | null;
};

export type JournalEntryDetail = {
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
  createdAt: string | null;
  updatedAt: string | null;
  lines: Array<{
    id: string;
    position: number;
    description: string | null;
    debit: string;
    credit: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
  }>;
};

function parseEntryDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new JournalEntryServiceError('invalid_date', `Invalid entry date: ${value}.`);
  }
  return parsed;
}

function toEntryDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toDateString(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

/** Create a balanced journal entry (used by bank sync automation). */
export async function createJournalEntry(
  input: JournalEntryCreateInput,
  options: JournalEntryCreateOptions = {},
): Promise<JournalEntryDetail> {
  const prisma = getAccountingPrisma();
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
        journalEntryLines: { create: lines },
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

  return mapJournalEntryDetail(created);
}

function mapJournalEntryDetail(created: {
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
  createdAt: Date | null;
  updatedAt: Date | null;
  _count: { journalEntryLines: number };
  journalEntryLines: Array<{
    id: string;
    position: number | null;
    description: string | null;
    debit: Prisma.Decimal | null;
    credit: Prisma.Decimal | null;
    account: { id: string; code: string; name: string; type: string };
  }>;
}): JournalEntryDetail {
  return {
    id: created.id,
    entryNumber: created.entryNumber,
    entryDate: toEntryDateString(created.entryDate),
    description: created.description,
    reference: created.reference,
    status: created.status,
    sourceModule: created.sourceModule,
    totalDebits: toAmountString(created.totalDebits ?? 0),
    totalCredits: toAmountString(created.totalCredits ?? 0),
    postedAt: toDateString(created.postedAt),
    reversesEntryId: created.reversesEntryId,
    reversedById: created.reversedById,
    lineCount: created._count.journalEntryLines,
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

export async function deleteJournalEntry(id: string): Promise<void> {
  const prisma = getAccountingPrisma();
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
