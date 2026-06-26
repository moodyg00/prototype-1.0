import { MERCURY_COA_BY_ACCOUNT_KIND } from '@/src/lib/mercury/config';
import type { MercuryAccount, MercuryAccountCard, MercuryTransaction } from '@/src/lib/mercury/types';

export function normalizeMercuryAccountKind(kind: string): 'checking' | 'savings' | 'other' {
  const value = kind.toLowerCase();
  if (value.includes('checking')) return 'checking';
  if (value.includes('savings')) return 'savings';
  return 'other';
}

export function coaCodeForMercuryAccountKind(kind: string): string | null {
  const normalized = normalizeMercuryAccountKind(kind);
  if (normalized === 'checking') return MERCURY_COA_BY_ACCOUNT_KIND.checking;
  if (normalized === 'savings') return MERCURY_COA_BY_ACCOUNT_KIND.savings;
  return null;
}

export function mapMercuryAccountType(kind: string): string {
  const normalized = normalizeMercuryAccountKind(kind);
  if (normalized === 'checking') return 'checking';
  if (normalized === 'savings') return 'savings';
  return 'other';
}

export function mapTransactionType(tx: MercuryTransaction): string {
  const kind = tx.kind.toLowerCase();
  if (kind === 'internaltransfer') {
    return tx.amount >= 0 ? 'transfer_in' : 'transfer_out';
  }
  if (kind.includes('fee')) return 'fee';
  if (kind.includes('interest')) return 'interest';
  if (tx.amount >= 0) return 'deposit';
  return 'withdrawal';
}

export function mapTransactionDate(tx: MercuryTransaction): Date {
  const source = tx.postedAt ?? tx.createdAt;
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
}

export function transactionDescription(tx: MercuryTransaction): string {
  return (
    tx.bankDescription?.trim() ||
    tx.externalMemo?.trim() ||
    tx.note?.trim() ||
    tx.counterpartyName ||
    'Mercury transaction'
  );
}

export function transactionReference(tx: MercuryTransaction): string | null {
  const value = tx.externalMemo?.trim() || tx.requestId?.trim() || null;
  return value && value.length > 0 ? value.slice(0, 120) : null;
}

export function externalCategory(tx: MercuryTransaction): string | null {
  return tx.categoryData?.name ?? tx.mercuryCategory ?? null;
}

export function centsFromBalance(amount: number): bigint {
  return BigInt(Math.round(amount * 100));
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function merchantDisplayName(tx: MercuryTransaction): string {
  return tx.merchant?.name?.trim() || tx.counterpartyName?.trim() || 'Unknown';
}

export function normalizeMerchantName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function merchantInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const initials = parts.map((part) => part[0] ?? '').join('').toUpperCase();
  return initials || '??';
}

export function isMercuryDepositoryAccount(account: MercuryAccount): boolean {
  return account.type === 'mercury' && ['checking', 'savings'].includes(normalizeMercuryAccountKind(account.kind));
}

export function mapMercuryCardStatus(status: string): string {
  const value = status.toLowerCase();
  if (value === 'active') return 'active';
  if (value === 'cancelled' || value === 'expired') return 'cancelled';
  if (value === 'frozen' || value === 'inactive' || value === 'suspended') return 'paused';
  return 'paused';
}

export function mercuryCardLabel(card: MercuryAccountCard): string {
  const suffix = card.type === 'virtual' ? 'Virtual' : 'Physical';
  return `${card.nameOnCard} ${suffix} ••${card.lastFourDigits}`;
}

export function mercuryCardSubtitle(card: MercuryAccountCard): string {
  const limit = (card.spendLimit.amountCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return `${card.type} ${card.network} · ${card.spendLimit.interval} limit ${limit}`;
}

export function mercuryProviderCardId(tx: MercuryTransaction): string | null {
  return tx.details?.debitCardInfo?.id ?? tx.details?.creditCardInfo?.id ?? null;
}
