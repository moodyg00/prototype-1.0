'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ledgerDatePresetRange } from '@/src/components/admin/ledger/ledger-date-presets';

type Props = {
  accountId: string;
  initialFrom: string;
  initialTo: string;
};

export function AccountLedgerPeriodPicker({
  accountId,
  initialFrom,
  initialTo,
}: Props): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const [from, setFrom] = React.useState(initialFrom);
  const [to, setTo] = React.useState(initialTo);

  const apply = React.useCallback(
    (nextFrom: string, nextTo: string) => {
      const next = new URLSearchParams(params.toString());
      if (nextFrom) next.set('from', nextFrom); else next.delete('from');
      if (nextTo) next.set('to', nextTo); else next.delete('to');
      router.push(`/admin/chart-of-accounts/${accountId}/ledger?${next.toString()}`);
    },
    [accountId, params, router],
  );

  const setPreset = React.useCallback(
    (preset: 'month' | 'quarter' | 'year' | 'all') => {
      const range = ledgerDatePresetRange(preset);
      setFrom(range.from);
      setTo(range.to);
      apply(range.from, range.to);
    },
    [apply],
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-1 rounded-lg border bg-[var(--card)] p-1">
        <Button type="button" size="sm" variant="ghost" onClick={() => setPreset('month')}>This month</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPreset('quarter')}>Quarter</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPreset('year')}>Year</Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setPreset('all')}>All time</Button>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">From</span>
        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">To</span>
        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
      </div>
      <Button type="button" variant="default" size="sm" onClick={() => apply(from, to)}>
        Apply
      </Button>
    </div>
  );
}
