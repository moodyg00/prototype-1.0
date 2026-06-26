'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { BankSyncButton } from '@/src/components/admin/banking/BankSyncButton';

type CardRecord = {
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
};

function BankCard({ card }: { card: CardRecord }) {
  const spentPct = card.limit > 0 ? Math.min(100, Math.round((card.spent / card.limit) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div
        className="relative overflow-hidden rounded-2xl select-none"
        style={{
          aspectRatio: '1.586',
          background: 'var(--bank-card-bg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.14)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 55%)',
          }}
        />

        <div className="absolute" style={{ top: '38%', left: '6%' }}>
          <div
            className="relative rounded-[4px]"
            style={{
              width: 42,
              height: 32,
              background: 'linear-gradient(135deg, #d4a843 0%, #e8c76a 40%, #c9993a 70%, #d4a843 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        <div className="absolute uppercase tracking-[0.24em] text-[10px] opacity-60" style={{ top: '8%', right: '6%', color: 'var(--card-text)' }}>
          {card.network}
        </div>

        <div className="absolute" style={{ bottom: '30%', left: '6%', right: '6%' }}>
          <span className="font-mono tracking-[0.22em] text-[14px]" style={{ color: 'var(--card-text)' }}>
            {card.cardNumber}
          </span>
        </div>

        <div className="absolute flex items-end justify-between" style={{ bottom: '7%', left: '6%', right: '6%' }}>
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5 opacity-40" style={{ color: 'var(--card-text)' }}>
              Card Holder
            </div>
            <div className="font-mono tracking-widest text-[11px]" style={{ color: 'var(--card-text)' }}>
              {card.cardholder}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5 opacity-40" style={{ color: 'var(--card-text)' }}>
              Type
            </div>
            <div className="font-mono tracking-widest text-[11px] uppercase" style={{ color: 'var(--card-text)' }}>
              {card.category}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-[15px] leading-tight">{card.label}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {card.subtitle}
            </div>
          </div>
          <Badge variant={card.statusVariant} className="shrink-0">
            {card.status}
          </Badge>
        </div>

        <div>
          <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
            <span>${card.spent.toLocaleString()} spent</span>
            <span>
              {spentPct}% of ${card.limit.toLocaleString()} {card.limitInterval}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${spentPct}%`,
                background: spentPct >= 95 ? '#ef4444' : spentPct >= 80 ? '#f59e0b' : 'var(--foreground)',
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" size="sm">
            {card.category}
          </Badge>
          {card.bankAccountName ? (
            <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: 'var(--muted-foreground)' }}>
              {card.bankAccountName}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function BankCardsPage() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/admin/bank-cards', { cache: 'no-store' });
      const body = (await response.json()) as { items?: CardRecord[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to load cards.');
      }
      setCards(Array.isArray(body.items) ? body.items : []);
    } catch (error) {
      setCards([]);
      setLoadError(error instanceof Error ? error.message : 'Unable to load cards.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  return (
    <div className="space-y-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em]"
            style={{
              borderColor: 'color-mix(in srgb, var(--border) 72%, #111 28%)',
              background: 'color-mix(in srgb, var(--card) 84%, #f3efe7 16%)',
              color: 'var(--muted-foreground)',
            }}
          >
            Banking
          </div>
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            Cards
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            {cards.length} cards
          </span>
          <BankSyncButton onSynced={loadCards} />
        </div>
      </header>

      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Cards are synced from Mercury and cannot be added or edited here.
      </p>

      {loadError ? <div className="text-sm text-rose-600">{loadError}</div> : null}

      {loading ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Loading cards…
        </div>
      ) : null}

      {!loading && cards.length === 0 ? (
        <Empty className="py-16">
          <EmptyHeader>
            <EmptyTitle>No Cards Found</EmptyTitle>
            <EmptyDescription>Sync from Mercury to import your virtual and physical cards.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}

      {!loading && cards.length > 0 ? (
        <div className="grid gap-x-20 gap-y-16 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.id} className="px-6 pt-6 pb-2">
              <BankCard card={card} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
