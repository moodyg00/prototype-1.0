import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RecordView } from '@/src/components/admin/RecordView';
import { formatAmount } from '@/src/lib/accounting/money';
import {
  getAccountLedger,
  getAccountSummary,
} from '@/src/lib/accounting/journal-entries';
import { cn } from '@/src/lib/utils';

export const dynamic = 'force-dynamic';

type PageParams = { id: string };

const TYPE_VARIANT: Record<string, React.ComponentProps<typeof Badge>['variant']> = {
  asset: 'success',
  liability: 'warning',
  equity: 'info',
  income: 'default',
  expense: 'secondary',
};

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { id } = await params;
  const [account, ledger] = await Promise.all([
    getAccountSummary(id),
    getAccountLedger(id, { limit: 5, from: null, to: null, cursor: null }),
  ]);
  if (!account) notFound();

  return (
    <RecordView
      title={`${account.code} · ${account.name}`}
      subtitle={account.description ?? undefined}
      badge={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={TYPE_VARIANT[account.type] ?? 'outline'} className="uppercase tracking-[0.22em]">
            {account.type}
          </Badge>
          {account.subType ? (
            <Badge variant="outline" className="tracking-[0.12em]">
              {formatSubType(account.subType)}
            </Badge>
          ) : null}
          <Badge variant={account.isActive ? 'success' : 'outline'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      }
      backHref="/admin/chart-of-accounts"
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Account code" value={account.code} mono />
          <MetricCard label="Type" value={account.type} />
          <MetricCard
            label="Lifetime balance"
            value={ledger ? `$${formatAmount(ledger.closingBalance)}` : '—'}
            mono
          />
          <MetricCard
            label="Lifetime activity"
            value={ledger ? `$${formatAmount(ledger.periodDebits)} / $${formatAmount(ledger.periodCredits)}` : '—'}
            mono
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4">
          <div className="space-y-1">
            <div className="text-sm font-semibold">Account ledger</div>
            <div className="text-xs text-[var(--muted-foreground)]">
              Per-account transactions with running balance, opening and closing totals.
            </div>
          </div>
          <Button
            render={<Link href={`/admin/chart-of-accounts/${account.id}/ledger`} />}
            variant="default"
            size="sm"
            className="rounded-full"
          >
            Open ledger
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            Metadata
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <MetadataField label="Account ID" value={account.id} mono />
            <MetadataField label="Classification" value={account.subType ? formatSubType(account.subType) : '—'} />
            <MetadataField label="Description" value={account.description ?? '—'} />
          </div>
        </div>
      </div>
    </RecordView>
  );
}

function formatSubType(subType: string): string {
  return subType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function MetricCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</div>
      <div className={cn('mt-2 text-lg font-semibold', mono ? 'tabular-nums font-mono' : null)}>{value}</div>
    </div>
  );
}

function MetadataField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className={cn('mt-1 text-sm font-medium break-all', mono ? 'font-mono' : null)}>{value}</div>
    </div>
  );
}
