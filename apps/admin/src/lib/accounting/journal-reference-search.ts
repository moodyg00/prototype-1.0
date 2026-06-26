import 'server-only';

import { prisma } from '@/src/lib/prisma';

export type JournalReferenceOption = {
  kind: 'invoice' | 'estimate' | 'work-order' | 'bank-transaction' | 'custom';
  reference: string;
  label: string;
  href: string | null;
  score: number;
};

function rankMatch(value: string, query: string): number {
  const haystack = value.toLowerCase();
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;
  if (haystack === needle) return 100;
  if (haystack.startsWith(needle)) return 80;
  if (haystack.includes(needle)) return 50;
  return 0;
}

function pushOption(
  options: JournalReferenceOption[],
  option: Omit<JournalReferenceOption, 'score'>,
  query: string,
) {
  const score = Math.max(
    rankMatch(option.reference, query),
    rankMatch(option.label, query),
  );
  if (query.trim() && score === 0) return;
  options.push({ ...option, score });
}

export async function searchJournalReferenceOptions(
  query: string,
  limit = 40,
): Promise<JournalReferenceOption[]> {
  const trimmed = query.trim();
  const options: JournalReferenceOption[] = [];

  const [invoices, estimates, workOrders, bankTransactions] = await Promise.all([
    prisma.invoice.findMany({
      take: 80,
      orderBy: [{ issueDate: 'desc' }],
      select: {
        id: true,
        invoiceNumber: true,
        organizationName: true,
        contactName: true,
        totalAmount: true,
      },
    }),
    prisma.estimate.findMany({
      take: 80,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        estimateNumber: true,
        title: true,
        contactName: true,
        totalAmount: true,
      },
    }),
    prisma.workOrder.findMany({
      take: 80,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        workOrderNumber: true,
        customerName: true,
        serviceName: true,
      },
    }),
    prisma.bankTransaction.findMany({
      take: 80,
      orderBy: [{ transactionDate: 'desc' }],
      select: {
        id: true,
        providerTransactionId: true,
        description: true,
        counterpartyName: true,
        amount: true,
        transactionDate: true,
      },
    }),
  ]);

  for (const invoice of invoices) {
    pushOption(
      options,
      {
        kind: 'invoice',
        reference: invoice.invoiceNumber,
        label: `${invoice.invoiceNumber} · ${invoice.organizationName ?? invoice.contactName ?? 'Invoice'} · $${invoice.totalAmount.toString()}`,
        href: `/admin/invoices/${invoice.id}`,
      },
      trimmed,
    );
  }

  for (const estimate of estimates) {
    pushOption(
      options,
      {
        kind: 'estimate',
        reference: estimate.estimateNumber,
        label: `${estimate.estimateNumber} · ${estimate.title ?? estimate.contactName ?? 'Estimate'} · $${estimate.totalAmount.toString()}`,
        href: `/admin/estimates/${estimate.id}`,
      },
      trimmed,
    );
  }

  for (const workOrder of workOrders) {
    const shortId = workOrder.workOrderNumber.slice(0, 8);
    pushOption(
      options,
      {
        kind: 'work-order',
        reference: workOrder.workOrderNumber,
        label: `${shortId}… · ${workOrder.customerName ?? 'Customer'} · ${workOrder.serviceName ?? 'Work order'}`,
        href: `/admin/work-orders/${workOrder.id}`,
      },
      trimmed,
    );
  }

  for (const transaction of bankTransactions) {
    const reference = transaction.providerTransactionId ?? transaction.id;
    const date = transaction.transactionDate.toISOString().slice(0, 10);
    pushOption(
      options,
      {
        kind: 'bank-transaction',
        reference,
        label: `${transaction.counterpartyName ?? transaction.description ?? 'Bank txn'} · ${date} · $${Math.abs(Number(transaction.amount)).toFixed(2)}`,
        href: `/admin/bank-transactions/${transaction.id}`,
      },
      trimmed,
    );
  }

  return options
    .sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference))
    .slice(0, limit);
}
