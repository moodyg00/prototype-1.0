
import { getAccountingPrisma } from '../db';
import { deleteJournalEntry } from '../create-journal-entry';

export type IgnoreTransactionErrorCode = 'not_found' | 'posted_journal';

export class IgnoreTransactionError extends Error {
  readonly code: IgnoreTransactionErrorCode;

  constructor(code: IgnoreTransactionErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'IgnoreTransactionError';
  }
}

export function ignoreTransactionErrorStatus(code: IgnoreTransactionErrorCode): number {
  switch (code) {
    case 'not_found':
      return 404;
    case 'posted_journal':
      return 409;
    default:
      return 400;
  }
}

export async function setBankTransactionIgnored(
  transactionId: string,
  ignore: boolean,
): Promise<{ ignored: boolean }> {
  const transaction = await getAccountingPrisma().bankTransaction.findUnique({
    where: { id: transactionId },
    include: {
      journalEntry: { select: { id: true, status: true } },
    },
  });

  if (!transaction) {
    throw new IgnoreTransactionError('not_found', 'Transaction not found.');
  }

  if (!ignore) {
    await getAccountingPrisma().bankTransaction.update({
      where: { id: transactionId },
      data: { ignoredAt: null },
    });
    return { ignored: false };
  }

  if (transaction.ignoredAt) {
    return { ignored: true };
  }

  if (transaction.journalEntry?.status === 'Posted') {
    throw new IgnoreTransactionError(
      'posted_journal',
      'Cannot ignore a transaction linked to a posted journal entry. Reverse the entry first.',
    );
  }

  const journalEntryId = transaction.journalEntryId;

  await getAccountingPrisma().$transaction(async (tx) => {
    if (journalEntryId) {
      await tx.bankTransaction.updateMany({
        where: { journalEntryId },
        data: { journalEntryId: null },
      });
    }

    await tx.bankTransaction.update({
      where: { id: transactionId },
      data: { ignoredAt: new Date(), journalEntryId: null },
    });

    await tx.bankTransactionReviewTask.deleteMany({
      where: { bankTransactionId: transactionId },
    });
  });

  if (journalEntryId) {
    await deleteJournalEntry(journalEntryId);
  }

  return { ignored: true };
}

export function isBankTransactionIgnored(ignoredAt: Date | null | undefined): boolean {
  return ignoredAt != null;
}
