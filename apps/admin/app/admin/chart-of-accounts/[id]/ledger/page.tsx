import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AccountLedgerPeriodPicker } from '@/src/components/admin/ledger/AccountLedgerPeriodPicker';
import { JournalEntryStatusBadge } from '@/src/components/admin/journal-entries/JournalEntryStatusBadge';
import { formatAmount } from '@/src/lib/accounting/money';
import { getAccountLedger } from '@/src/lib/accounting/journal-entries';
import { cn } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

type PageParams = { id: string };

type SearchParams = {
  from?: string;
  to?: string;
};

const TYPE_VARIANT: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  asset: 'success',
  liability: 'warning',
  equity: 'info',
  income: 'default',
  expense: 'secondary',
};

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<PageParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const from = search.from ?? null;
  const to = search.to ?? null;

  const payload = await getAccountLedger(id, {
    from,
    to,
    limit: 200,
    cursor: null,
  });
  if (!payload) notFound();

  const { account } = payload;

  return (
    <div className="space-y-6 pb-6">
      <header className="space-y-4">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--muted-foreground)]">
          <Link href="/admin/chart-of-accounts" className="underline-offset-4 hover:underline">
            Chart of accounts
          </Link>
          <span className="px-1.5">/</span>
          <Link
            href={`/admin/chart-of-accounts/${account.id}`}
            className="underline-offset-4 hover:underline"
          >
            {account.code} · {account.name}
          </Link>
          <span className="px-1.5">/</span>
          <span>Ledger</span>
        </nav>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {account.code} · {account.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={TYPE_VARIANT[account.type] ?? 'outline'} className="uppercase tracking-[0.22em]">
                {account.type}
              </Badge>
              <Badge variant={account.isActive ? 'success' : 'outline'}>
                {account.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {account.description ? (
                <span className="text-xs text-[var(--muted-foreground)]">{account.description}</span>
              ) : null}
            </div>
          </div>
          <Button
            render={<Link href={`/admin/chart-of-accounts/${account.id}`} />}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            Back to account
          </Button>
        </div>

        <div className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Opening balance" value={`$${formatAmount(payload.openingBalance)}`} />
          <SummaryStat label="Period debits" value={`$${formatAmount(payload.periodDebits)}`} />
          <SummaryStat label="Period credits" value={`$${formatAmount(payload.periodCredits)}`} />
          <SummaryStat
            label="Closing balance"
            value={`$${formatAmount(payload.closingBalance)}`}
            emphasized
          />
        </div>

        <AccountLedgerPeriodPicker
          accountId={account.id}
          initialFrom={payload.from ?? ''}
          initialTo={payload.to ?? ''}
        />
      </header>

      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <div className="text-sm font-semibold">Transactions</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              {payload.lines.length} lines, oldest first within the selected period.
            </div>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Account ledger
          </Badge>
        </div>
        <Table variant="card">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-32">Entry</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Reference</TableHead>
              <TableHead className="w-24 text-right">Debit</TableHead>
              <TableHead className="w-24 text-right">Credit</TableHead>
              <TableHead className="w-28 text-right">Running</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payload.lines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No activity in this period</EmptyTitle>
                      <EmptyDescription>
                        Try adjusting the date range or check that posted entries reference this
                        account.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : null}
            {payload.lines.map((line) => (
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
                <TableCell className="text-sm">
                  <div>{line.description ?? line.entryDescription ?? '—'}</div>
                  {line.entryDescription && line.description && line.description !== line.entryDescription ? (
                    <div className="text-xs text-[var(--muted-foreground)]">{line.entryDescription}</div>
                  ) : null}
                </TableCell>
                <TableCell className="text-xs text-[var(--muted-foreground)]">{line.reference ?? '—'}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatAmount(line.debit)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatAmount(line.credit)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatAmount(line.runningBalance)}</TableCell>
                <TableCell>
                  <JournalEntryStatusBadge status={line.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {payload.nextCursor ? (
          <div className="px-6 py-3 text-xs text-[var(--muted-foreground)]">
            More lines exist; narrow the date range to drill in further.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</div>
      <div
        className={cn('mt-1 tabular-nums', emphasized ? 'text-2xl font-semibold' : 'text-lg font-medium')}
      >
        {value}
      </div>
    </div>
  );
}
