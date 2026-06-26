import { prisma } from '@/src/lib/prisma';

import { tryCreateJournalFromBankTransaction } from '@/src/lib/banking/journal-from-transaction';

export async function assignManualBankCategory(
  transactionId: string,
  args: {
    internalCategory: string;
    reason: string;
    createJournalEntry?: boolean;
  },
): Promise<void> {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
    select: { id: true, providerStatus: true, journalEntryId: true, ignoredAt: true },
  });

  if (!transaction) {
    throw new Error(`Bank transaction not found: ${transactionId}`);
  }

  if (transaction.ignoredAt) {
    throw new Error('Ignored transactions cannot be recategorized.');
  }

  await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      internalCategory: args.internalCategory,
      categorySource: 'manual',
      status: 'categorized',
      ruleResolutionStatus: 'processed',
      ruleConfidence: null,
      ruleReason: args.reason,
    },
  });

  await prisma.bankTransactionReviewTask.deleteMany({
    where: { bankTransactionId: transactionId, status: 'open' },
  });

  if (args.createJournalEntry !== false && !transaction.journalEntryId && transaction.providerStatus === 'sent') {
    await tryCreateJournalFromBankTransaction(transactionId);
  }
}
