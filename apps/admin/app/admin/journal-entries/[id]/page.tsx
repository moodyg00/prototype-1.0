import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { JournalEntryDetailActions } from '@/src/components/admin/journal-entries/JournalEntryDetailActions';
import { JournalEntryStatusBadge } from '@/src/components/admin/journal-entries/JournalEntryStatusBadge';
import { RecordView } from '@/src/components/admin/RecordView';
import { formatAmount, isBalanced } from '@/src/lib/accounting/money';
import { getJournalEntryDetail } from '@/src/lib/accounting/journal-entries';
import { cn } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

type PageParams = { id: string };

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { id } = await params;
  const entry = await getJournalEntryDetail(id);
  if (!entry) notFound();

  const balanced = isBalanced(entry.totalDebits, entry.totalCredits);

  return (
    <RecordView
      title={entry.entryNumber}
      subtitle={`Entry date: ${entry.entryDate}`}
      badge={
        <div className="flex flex-wrap items-center gap-2">
          <JournalEntryStatusBadge status={entry.status} />
          <Badge variant={balanced ? 'success' : 'warning'} className="uppercase tracking-[0.22em]">
            {balanced ? 'Balanced' : 'Out of balance'}
          </Badge>
          {entry.reversesEntryId ? (
            <Badge variant="info">
              <Link href={`/admin/journal-entries/${entry.reversesEntryId}`} className="underline-offset-4 hover:underline">
                Reverses prior entry
              </Link>
            </Badge>
          ) : null}
          {entry.reversedById ? (
            <Badge variant="warning">
              <Link href={`/admin/journal-entries/${entry.reversedById}`} className="underline-offset-4 hover:underline">
                Reversed by later entry
              </Link>
            </Badge>
          ) : null}
        </div>
      }
      backHref="/admin/journal-entries"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Source" value={entry.sourceModule ?? 'manual'} />
          <MetricCard label="Reference" value={entry.reference ?? '—'} />
          <MetricCard label="Total debits" value={`$${formatAmount(entry.totalDebits)}`} mono />
          <MetricCard label="Total credits" value={`$${formatAmount(entry.totalCredits)}`} mono />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-card px-5 py-4">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              Memo
            </div>
            <div className="text-sm">{entry.description ?? 'No description provided.'}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              render={<Link href="/admin/ledger" />}
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              Open ledger
            </Button>
            <JournalEntryDetailActions
              entryId={entry.id}
              entryNumber={entry.entryNumber}
              status={entry.status}
              reversedById={entry.reversedById}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <div className="text-sm font-semibold">Entry lines</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                {entry.lineCount} line items, ordered by position
              </div>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
              Journal
            </Badge>
          </div>
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-right">#</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-28 text-right">Debit</TableHead>
                <TableHead className="w-28 text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entry.lines.map((line, index) => (
                <TableRow key={line.id}>
                  <TableCell className="text-right text-xs text-[var(--muted-foreground)] tabular-nums">
                    {index + 1}
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
                      <Link
                        href={`/admin/chart-of-accounts/${line.accountId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {line.accountName}
                      </Link>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">{line.accountType}</div>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--muted-foreground)]">
                    {line.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatAmount(line.debit)}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatAmount(line.credit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Metadata
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetadataField label="Entry ID" value={entry.id} mono />
            <MetadataField label="Status" value={entry.status} />
            <MetadataField label="Posted at" value={entry.postedAt ?? '—'} />
            <MetadataField label="Updated at" value={entry.updatedAt ?? '—'} />
          </div>
        </div>
      </div>
    </RecordView>
  );
}

function MetricCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</div>
      <div className={cn('mt-2 text-lg font-semibold', mono ? 'tabular-nums' : null)}>{value}</div>
    </div>
  );
}

function MetadataField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className={cn('mt-1 text-sm font-medium break-all', mono ? 'font-mono' : null)}>
        {value}
      </div>
    </div>
  );
}
