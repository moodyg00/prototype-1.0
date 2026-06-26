'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AccountCombobox,
  type AccountOption,
} from '@/src/components/admin/journal-entries/AccountCombobox';
import { JournalEntryStatusBadge } from '@/src/components/admin/journal-entries/JournalEntryStatusBadge';
import { defaultLedgerDateRange } from '@/src/components/admin/ledger/ledger-default-range';
import { formatAmount } from '@/src/lib/accounting/money';

type LedgerLine = {
  id: string;
  entryId: string;
  entryNumber: string;
  entryDate: string;
  position: number;
  description: string | null;
  entryDescription: string | null;
  reference: string | null;
  sourceModule: string | null;
  status: 'Draft' | 'Posted' | 'Reversed';
  debit: string;
  credit: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
};

type StatusValue = 'all' | 'Draft' | 'Posted' | 'Reversed';

const STATUS_OPTIONS: Array<{ value: StatusValue; label: string }> = [
  { value: 'Posted', label: 'Posted' },
  { value: 'Reversed', label: 'Reversed' },
  { value: 'Draft', label: 'Draft' },
  { value: 'all', label: 'All' },
];

type Props = {
  accounts: ReadonlyArray<AccountOption>;
  initialLines: ReadonlyArray<LedgerLine>;
  initialNextCursor: string | null;
};

export function GlobalLedgerWorkspace({
  accounts,
  initialLines,
  initialNextCursor,
}: Props): React.ReactElement {
  const [search, setSearch] = React.useState('');
  const [accountId, setAccountId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<StatusValue>('Posted');
  const initialDateRange = React.useMemo(() => defaultLedgerDateRange(), []);
  const [from, setFrom] = React.useState(initialDateRange.from);
  const [to, setTo] = React.useState(initialDateRange.to);

  const [lines, setLines] = React.useState<LedgerLine[]>(() => [...initialLines]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(initialNextCursor);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const buildParams = React.useCallback(
    (cursor?: string | null) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (accountId) params.set('accountId', accountId);
      params.set('status', status);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      params.set('limit', '100');
      if (cursor) params.set('cursor', cursor);
      return params;
    },
    [search, accountId, status, from, to],
  );

  const loadLines = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/ledger?${buildParams().toString()}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as {
        items?: LedgerLine[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load ledger.');
      setLines(body.items ?? []);
      setNextCursor(body.nextCursor ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load ledger.');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadMore = React.useCallback(async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/admin/ledger?${buildParams(nextCursor).toString()}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as {
        items?: LedgerLine[];
        nextCursor?: string | null;
        error?: string;
      };
      if (!response.ok) throw new Error(body.error ?? 'Failed to load more lines.');
      setLines((current) => [...current, ...(body.items ?? [])]);
      setNextCursor(body.nextCursor ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load more lines.');
    } finally {
      setLoadingMore(false);
    }
  }, [buildParams, nextCursor]);

  // Refetch whenever any filter changes (debounced for search).
  React.useEffect(() => {
    const timer = window.setTimeout(loadLines, 250);
    return () => window.clearTimeout(timer);
  }, [loadLines]);

  const totals = React.useMemo(() => {
    let debits = 0;
    let credits = 0;
    for (const line of lines) {
      debits += Number(line.debit);
      credits += Number(line.credit);
    }
    return { debits, credits };
  }, [lines]);

  return (
    <div className="space-y-6 pb-6">
      <header
        className="rounded-xl border bg-card px-6 py-5"
        style={{
          background: 'color-mix(in srgb, var(--card) 92%, #f3efe7 8%)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="uppercase tracking-[0.22em]">Accounting</Badge>
              <Badge variant="info">Ledger</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">General ledger</h1>
            <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
              Every line of every journal entry, sorted newest first. Click an entry number for
              the full entry, or an account to drill into its own ledger.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Search
              </span>
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Entry, memo, or reference"
                  className="w-72 pl-9"
                  type="search"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Account
              </span>
              <div className="w-72">
                <AccountCombobox
                  accounts={accounts}
                  value={accountId}
                  onValueChange={setAccountId}
                  placeholder="All accounts"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[auto_auto_auto_auto_1fr]">
          <FilterField label="From">
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </FilterField>
          <FilterField label="To">
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </FilterField>
          <FilterField label="Status">
            <div className="flex items-center gap-1 rounded-lg border bg-[var(--card)] p-1">
              {STATUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={status === option.value ? 'default' : 'ghost'}
                  onClick={() => setStatus(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </FilterField>
          <div className="flex items-end justify-end gap-3 text-xs text-[var(--muted-foreground)] sm:col-start-5">
            <span>
              {lines.length} lines · ${totals.debits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} debits ·
              ${totals.credits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credits
            </span>
          </div>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-32">Entry</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Reference</TableHead>
              <TableHead className="w-24 text-right">Debit</TableHead>
              <TableHead className="w-24 text-right">Credit</TableHead>
              <TableHead className="w-24">Source</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && lines.length === 0
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={`skel-${idx}`}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : null}
            {!loading && lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No ledger activity</EmptyTitle>
                      <EmptyDescription>
                        Nothing matches the current filters. Try widening the date range,
                        clearing the search, or changing the status filter.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : null}
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-xs text-[var(--muted-foreground)] tabular-nums">
                  {line.entryDate}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/journal-entries/${line.entryId}`}
                    className="font-mono text-sm underline-offset-4 hover:underline"
                  >
                    {line.entryNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    <Link
                      href={`/admin/chart-of-accounts/${line.accountId}/ledger`}
                      className="font-mono text-sm underline-offset-4 hover:underline"
                    >
                      {line.accountCode}
                    </Link>
                    <span className="px-1.5 text-[var(--muted-foreground)]">·</span>
                    <span>{line.accountName}</span>
                  </div>
                  <div className="text-xs text-[var(--muted-foreground)]">{line.accountType}</div>
                </TableCell>
                <TableCell className="text-sm">
                  <div>{line.description ?? line.entryDescription ?? '—'}</div>
                  {line.entryDescription && line.description && line.description !== line.entryDescription ? (
                    <div className="text-xs text-[var(--muted-foreground)]">{line.entryDescription}</div>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs text-[var(--muted-foreground)]">{line.reference ?? '—'}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatAmount(line.debit)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatAmount(line.credit)}</TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">{line.sourceModule ?? 'manual'}</Badge>
                </TableCell>
                <TableCell>
                  <JournalEntryStatusBadge status={line.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between px-6 py-3 text-xs text-[var(--muted-foreground)]">
          <span>{loading ? 'Loading…' : `${lines.length} lines`}</span>
          {nextCursor ? (
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </div>
  );
}
