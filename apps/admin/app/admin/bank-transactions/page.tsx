'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '../../../src/components/admin/StatusBadge';
import { BankSyncButton } from '../../../src/components/admin/banking/BankSyncButton';
import { BankTransactionIgnoreButton } from '../../../src/components/admin/banking/BankTransactionIgnoreButton';
import { ArrowUpRight, ArrowDownRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';

type Transaction = {
  id: string;
  date: string;
  avatar: string;
  name: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  status: string;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
  internalCategory: string | null;
  ruleResolutionStatus: string;
  ignored: boolean;
};

export default function BankTransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'pending' | 'ignored'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({
        filter,
        limit: String(pageSize),
        offset: String((currentPage - 1) * pageSize),
      });
      if (search.trim()) params.set('q', search.trim());

      const response = await fetch(`/api/admin/bank-transactions?${params.toString()}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as { items?: Transaction[]; total?: number; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to load bank transactions.');
      }
      setTransactions(Array.isArray(body.items) ? body.items : []);
      setTotal(typeof body.total === 'number' ? body.total : 0);
    } catch (error) {
      setTransactions([]);
      setTotal(0);
      setLoadError(error instanceof Error ? error.message : 'Unable to load bank transactions.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, search]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = transactions;

  const activeTransactions = paginated.filter((t) => !t.ignored);
  const totalIncome = activeTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = activeTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Transactions are synced from Mercury. You cannot add or edit them here — use Ignore to exclude a
        transaction from journal entries and accounting reports.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em]" style={{ borderColor: 'color-mix(in srgb, var(--border) 72%, #111111 28%)', background: 'color-mix(in srgb, var(--card) 84%, #f3efe7 16%)', color: 'var(--muted-foreground)' }}>
          Bank Transactions
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/bank/rules/reprocess', { method: 'POST' });
                const body = (await response.json()) as { matched?: number; unmatched?: number; error?: string };
                if (!response.ok) throw new Error(body.error ?? 'Rule reprocess failed.');
                toast.success(`Rules applied: ${body.matched ?? 0} matched, ${body.unmatched ?? 0} need review.`);
                await loadTransactions();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Rule reprocess failed.');
              }
            }}
          >
            Apply Rules
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                const response = await fetch('/api/admin/bank/journal-entries/generate', { method: 'POST' });
                const body = (await response.json()) as { created?: number; skipped?: number; error?: string };
                if (!response.ok) throw new Error(body.error ?? 'Journal generation failed.');
                toast.success(`Created ${body.created ?? 0} draft journal entries (${body.skipped ?? 0} skipped).`);
                await loadTransactions();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Journal generation failed.');
              }
            }}
          >
            Generate JEs
          </Button>
          <BankSyncButton onSynced={loadTransactions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs text-[var(--muted-foreground)]">Net for page</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums">${(totalIncome - totalExpense).toLocaleString()}</div>
          <div className="text-xs text-[var(--muted-foreground)] mt-1">{total} total transactions</div>
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Income</div>
            <div className="text-2xl font-semibold text-emerald-600 tabular-nums mt-1">+${totalIncome.toLocaleString()}</div>
          </div>
          <ArrowUpRight className="w-8 h-8 text-emerald-600" />
        </Card>
        <Card className="p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--muted-foreground)]">Expenses</div>
            <div className="text-2xl font-semibold text-rose-600 tabular-nums mt-1">-${totalExpense.toLocaleString()}</div>
          </div>
          <ArrowDownRight className="w-8 h-8 text-rose-600" />
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-3.5 text-[var(--muted-foreground)]" />
          <Input type="text" placeholder="Search transactions or counterparties..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11" />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense', 'pending', 'ignored'] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'secondary'} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">All Records</Badge>
          <div className="text-xs text-[var(--muted-foreground)]">{total} transactions</div>
        </div>

        {loadError ? (
          <div className="px-6 py-10 text-sm text-rose-600">{loadError}</div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead className="text-right w-32">Amount</TableHead>
              <TableHead className="w-36">Category</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <Empty className="py-12 md:py-14">
                    <EmptyHeader>
                      <EmptyTitle>No Transactions Found</EmptyTitle>
                      <EmptyDescription>
                        {total === 0
                          ? 'Sync from Mercury to import your checking and savings activity.'
                          : 'No transactions match your filters.'}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                  Loading transactions…
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              paginated.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-[var(--muted)]/50 group cursor-pointer"
                  onClick={() => router.push(`/admin/bank-transactions/${tx.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/admin/bank-transactions/${tx.id}`);
                    }
                  }}
                  tabIndex={0}
                >
                  <TableCell className="font-mono text-sm text-[var(--muted-foreground)]">
                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-xs font-semibold text-[var(--primary)]">
                      {tx.avatar}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      <Link href={`/admin/bank-transactions/${tx.id}`} className="underline-offset-4 hover:underline">
                        {tx.name}
                      </Link>
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)] line-clamp-1">{tx.description}</div>
                  </TableCell>
                  <TableCell className={`text-right font-medium tabular-nums ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {tx.internalCategory ? (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                          {tx.internalCategory.replace(/_/g, ' ')}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">Needs review</span>
                      )}
                      {tx.journalEntryNumber ? (
                        <Link
                          href={`/admin/journal-entries/${tx.journalEntryId}`}
                          className="block text-[10px] text-[var(--muted-foreground)] hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {tx.journalEntryNumber}
                        </Link>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tx.ignored ? 'ignored' : tx.ruleResolutionStatus === 'processed' ? 'categorized' : tx.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <BankTransactionIgnoreButton
                        transactionId={tx.id}
                        ignored={tx.ignored}
                        size="xs"
                        onChanged={loadTransactions}
                      />
                      <Link href={`/admin/bank-transactions/${tx.id}`} onClick={(event) => event.stopPropagation()}>
                        <Button variant="secondary" size="xs">
                          View
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 border-t text-sm">
          <div className="text-[var(--muted-foreground)]">
            Showing {total === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-[var(--muted-foreground)]">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
