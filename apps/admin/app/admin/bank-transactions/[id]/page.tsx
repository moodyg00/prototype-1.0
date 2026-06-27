import { notFound } from 'next/navigation';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BankTransactionIgnoreButton } from '@/src/components/admin/banking/BankTransactionIgnoreButton';
import { getBankTransactionDetail } from '@prototype/accounting';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default async function BankTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transaction = await getBankTransactionDetail(id);
  if (!transaction) notFound();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
            Banking
          </div>
          <h1 className="text-2xl font-semibold">{transaction.name}</h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {transaction.date} · {transaction.bankAccountName}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BankTransactionIgnoreButton transactionId={transaction.id} ignored={transaction.ignored} />
          <Button variant="outline" render={<Link href="/admin/bank-transactions" />}>
            Back to transactions
          </Button>
        </div>
      </div>

      {transaction.ignored ? (
        <Card className="border-dashed p-4 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          This transaction is ignored. It will not receive a journal entry and is excluded from the ledger and
          financial reports.
        </Card>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
              Amount
            </div>
            <div className="mt-1 text-xl font-semibold">{formatCurrency(transaction.amount)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
              Status
            </div>
            <div className="mt-1">
              <Badge variant="outline">{transaction.status}</Badge>
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
              Category
            </div>
            <div className="mt-1 text-sm">{transaction.internalCategory ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
              Rule resolution
            </div>
            <div className="mt-1 text-sm">{transaction.ruleResolutionStatus}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
              Description
            </div>
            <div className="mt-1 text-sm">{transaction.description || '—'}</div>
          </div>
          {transaction.reference ? (
            <div>
              <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
                Reference
              </div>
              <div className="mt-1 text-sm">{transaction.reference}</div>
            </div>
          ) : null}
          {transaction.journalEntryNumber ? (
            <div>
              <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--muted-foreground)' }}>
                Journal entry
              </div>
              <div className="mt-1 text-sm">
                <Link
                  href={`/admin/journal-entries/${transaction.journalEntryId}`}
                  className="underline underline-offset-2"
                >
                  {transaction.journalEntryNumber}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
