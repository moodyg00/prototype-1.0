import { prisma } from '@/src/lib/prisma';

export type BankCardListItem = {
  id: string;
  label: string;
  subtitle: string;
  cardNumber: string;
  cardholder: string;
  network: 'visa' | 'mastercard' | 'amex';
  category: 'physical' | 'virtual';
  status: string;
  statusVariant: 'success' | 'warning' | 'info' | 'error';
  spent: number;
  limit: number;
  limitInterval: string;
  owner: string;
  bankAccountName: string | null;
  lastSyncedAt: string | null;
};

function statusVariant(status: string): BankCardListItem['statusVariant'] {
  if (status === 'active') return 'success';
  if (status === 'paused') return 'warning';
  if (status === 'cancelled') return 'error';
  return 'info';
}

function networkValue(value: string | null): BankCardListItem['network'] {
  if (value === 'visa' || value === 'mastercard' || value === 'amex') return value;
  return 'mastercard';
}

export async function listBankCards(): Promise<BankCardListItem[]> {
  const cards = await prisma.bankCard.findMany({
    orderBy: [{ status: 'asc' }, { cardName: 'asc' }],
    take: 200,
    include: {
      bankAccount: { select: { name: true } },
      bankTransactions: {
        where: { amount: { lt: 0 } },
        select: { amount: true },
      },
    },
  });

  return cards.map((card) => {
    const spent = card.bankTransactions.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    const limit = card.spendLimitAmountCents != null ? Number(card.spendLimitAmountCents) / 100 : 0;
    const last4 = card.last4 ?? '0000';

    return {
      id: card.id,
      label: card.cardName,
      subtitle: `${card.cardType ?? 'card'} · ${card.bankAccount?.name ?? 'Unlinked account'}`,
      cardNumber: `•••• •••• •••• ${last4}`,
      cardholder: card.cardName.split(' ').slice(0, 2).join(' ').toUpperCase(),
      network: networkValue(card.network),
      category: card.cardType === 'physical' ? 'physical' : 'virtual',
      status: card.status,
      statusVariant: statusVariant(card.status),
      spent,
      limit,
      limitInterval: card.spendLimitInterval ?? 'daily',
      owner: card.cardName,
      bankAccountName: card.bankAccount?.name ?? null,
      lastSyncedAt: card.lastSyncedAt?.toISOString() ?? null,
    };
  });
}
