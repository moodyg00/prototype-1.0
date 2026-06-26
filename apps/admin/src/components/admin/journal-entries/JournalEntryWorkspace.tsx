'use client';

import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  AccountCombobox,
  type AccountOption,
} from '@/src/components/admin/journal-entries/AccountCombobox';
import { ReferenceCombobox } from '@/src/components/admin/journal-entries/ReferenceCombobox';
import { JournalEntryStatusBadge } from '@/src/components/admin/journal-entries/JournalEntryStatusBadge';
import { add, formatAmount, isBalanced, sub, sum, toDecimal } from '@/src/lib/accounting/money';

type LineDraft = {
  key: string;
  accountId: string | null;
  description: string;
  debit: string;
  credit: string;
};

type EntrySummary = {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string | null;
  reference: string | null;
  status: 'Draft' | 'Posted' | 'Reversed';
  sourceModule: string | null;
  totalDebits: string;
  totalCredits: string;
  postedAt: string | null;
  reversesEntryId: string | null;
  reversedById: string | null;
  lineCount: number;
};

type WorkspaceProps = {
  accounts: ReadonlyArray<AccountOption>;
  initialEntries: ReadonlyArray<EntrySummary>;
};

function makeKey() {
  return Math.random().toString(36).slice(2, 9);
}

function blankLine(): LineDraft {
  return { key: makeKey(), accountId: null, description: '', debit: '', credit: '' };
}

function blankLines(): LineDraft[] {
  return [blankLine(), blankLine()];
}

function todayISO() {
  return format(new Date(), 'yyyy-MM-dd');
}

function parseAmount(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '0';
  return trimmed;
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Posted', label: 'Posted' },
  { value: 'Reversed', label: 'Reversed' },
] as const;

export function JournalEntryWorkspace({
  accounts,
  initialEntries,
}: WorkspaceProps): React.ReactElement {
  const [entryDate, setEntryDate] = React.useState(() => todayISO());
  const [reference, setReference] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [lines, setLines] = React.useState<LineDraft[]>(() => blankLines());
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [entries, setEntries] = React.useState<EntrySummary[]>(() => [...initialEntries]);
  const [statusFilter, setStatusFilter] =
    React.useState<(typeof STATUS_FILTERS)[number]['value']>('all');
  const [search, setSearch] = React.useState('');
  const [loadingEntries, setLoadingEntries] = React.useState(false);
  const [actionPendingId, setActionPendingId] = React.useState<string | null>(null);

  const formRef = React.useRef<HTMLFormElement | null>(null);

  const focusFirstAccount = React.useCallback(() => {
    const target = document.getElementById('je-line-0-account') as HTMLInputElement | null;
    target?.focus();
  }, []);

  /* ---------------- balance bookkeeping ---------------- */

  const totals = React.useMemo(() => {
    const debits = sum(lines.map((l) => parseAmount(l.debit)));
    const credits = sum(lines.map((l) => parseAmount(l.credit)));
    const balanced = isBalanced(debits, credits);
    const difference = sub(debits, credits);
    return {
      debits: formatAmount(debits),
      credits: formatAmount(credits),
      balanced,
      difference: formatAmount(difference.abs()),
      side: difference.isPos() ? ('credit' as const) : ('debit' as const),
      hasAmounts: !toDecimal(debits).isZero() || !toDecimal(credits).isZero(),
    };
  }, [lines]);

  const canSubmit =
    totals.balanced &&
    totals.hasAmounts &&
    lines.length >= 2 &&
    lines.every((line) => line.accountId);

  /* ---------------- form handlers ---------------- */

  const updateLine = React.useCallback((index: number, patch: Partial<LineDraft>) => {
    setLines((current) => {
      const next = [...current];
      const merged = { ...next[index], ...patch };
      // Debit clears credit and vice versa.
      if (patch.debit !== undefined && patch.debit !== '' && parseFloat(patch.debit) > 0) {
        merged.credit = '';
      }
      if (patch.credit !== undefined && patch.credit !== '' && parseFloat(patch.credit) > 0) {
        merged.debit = '';
      }
      next[index] = merged;
      return next;
    });
  }, []);

  const addLine = React.useCallback(() => {
    setLines((current) => [...current, blankLine()]);
  }, []);

  const removeLine = React.useCallback((index: number) => {
    setLines((current) => (current.length <= 2 ? current : current.filter((_, i) => i !== index)));
  }, []);

  const resetForm = React.useCallback(() => {
    setEntryDate(todayISO());
    setReference('');
    setDescription('');
    setLines(blankLines());
    setErrors({});
    window.setTimeout(focusFirstAccount, 50);
  }, [focusFirstAccount]);

  /* ---------------- list bookkeeping ---------------- */

  const loadEntries = React.useCallback(async () => {
    setLoadingEntries(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim().length > 0) params.set('q', search.trim());
      params.set('limit', '50');
      const response = await fetch(`/api/admin/journal-entries?${params.toString()}`, {
        cache: 'no-store',
      });
      const body = (await response.json()) as { items?: EntrySummary[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? 'Failed to load journal entries.');
      }
      setEntries(body.items ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load journal entries.');
    } finally {
      setLoadingEntries(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    const timer = window.setTimeout(loadEntries, 250);
    return () => window.clearTimeout(timer);
  }, [loadEntries]);

  /* ---------------- submit ---------------- */

  const handleSubmit = React.useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!canSubmit || submitting) return;

      setSubmitting(true);
      setErrors({});
      try {
        const payload = {
          entryDate,
          description: description.trim() || null,
          reference: reference.trim() || null,
          lines: lines.map((line) => ({
            accountId: line.accountId!,
            description: line.description.trim() || null,
            debit: parseAmount(line.debit),
            credit: parseAmount(line.credit),
          })),
        };

        const response = await fetch('/api/admin/journal-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = (await response.json()) as {
          entry?: EntrySummary;
          error?: string;
          details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        };

        if (!response.ok) {
          if (body.details?.fieldErrors) {
            const nextErrors: Record<string, string> = {};
            Object.entries(body.details.fieldErrors).forEach(([key, messages]) => {
              if (messages?.[0]) nextErrors[key] = messages[0];
            });
            setErrors(nextErrors);
          }
          throw new Error(body.error ?? 'Failed to save journal entry.');
        }
        toast.success(`Saved draft ${body.entry?.entryNumber ?? ''}`.trim());
        if (body.entry) {
          setEntries((current) => [body.entry as EntrySummary, ...current]);
        }
        resetForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save journal entry.');
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, submitting, entryDate, description, reference, lines, resetForm],
  );

  /* ---------------- keyboard shortcuts ---------------- */

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLFormElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (canSubmit && !submitting) handleSubmit();
        return;
      }
      if (event.shiftKey && event.key === 'Enter') {
        // Only intercept if focus is inside the line table area.
        const target = event.target as HTMLElement | null;
        if (target?.closest('[data-line-row]')) {
          event.preventDefault();
          addLine();
        }
      }
    },
    [canSubmit, submitting, handleSubmit, addLine],
  );

  /* ---------------- amount Tab helper ---------------- */

  const handleAmountKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, index: number, kind: 'debit' | 'credit') => {
      if (event.key !== 'Tab' || event.shiftKey) return;
      // Only autofill when the row already has an amount AND the entry is currently
      // off-balance; this avoids clobbering values the user is deliberately editing.
      const debits = sum(lines.map((l) => parseAmount(l.debit)));
      const credits = sum(lines.map((l) => parseAmount(l.credit)));
      const difference = sub(debits, credits);
      if (difference.isZero()) return;
      const nextIndex = index + 1;
      if (nextIndex >= lines.length) return;
      const target = lines[nextIndex];
      const opposite: 'debit' | 'credit' = kind === 'debit' ? 'credit' : 'debit';
      if (target[opposite].trim().length > 0) return;
      const fillValue = difference.abs().toFixed(2);
      updateLine(nextIndex, { [opposite]: fillValue } as Partial<LineDraft>);
    },
    [lines, updateLine],
  );

  /* ---------------- list row actions ---------------- */

  const handlePost = React.useCallback(async (id: string) => {
    setActionPendingId(id);
    try {
      const response = await fetch(`/api/admin/journal-entries/${id}/post`, { method: 'POST' });
      const body = (await response.json()) as { entry?: EntrySummary; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Failed to post journal entry.');
      toast.success(`Posted ${body.entry?.entryNumber}`);
      setEntries((current) =>
        current.map((entry) => (entry.id === id && body.entry ? body.entry : entry)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to post journal entry.');
    } finally {
      setActionPendingId(null);
    }
  }, []);

  const handleReverse = React.useCallback(
    async (id: string) => {
      setActionPendingId(id);
      try {
        const response = await fetch(`/api/admin/journal-entries/${id}/reverse`, {
          method: 'POST',
        });
        const body = (await response.json()) as {
          original?: EntrySummary;
          reversal?: EntrySummary;
          error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? 'Failed to reverse journal entry.');
        toast.success(`Reversed ${body.original?.entryNumber}`);
        await loadEntries();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to reverse journal entry.');
      } finally {
        setActionPendingId(null);
      }
    },
    [loadEntries],
  );

  const handleDelete = React.useCallback(async (id: string) => {
    if (!window.confirm('Delete this draft journal entry?')) return;
    setActionPendingId(id);
    try {
      const response = await fetch(`/api/admin/journal-entries/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to delete journal entry.');
      }
      toast.success('Deleted draft');
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete draft.');
    } finally {
      setActionPendingId(null);
    }
  }, []);

  /* ---------------- render ---------------- */

  return (
    <div className="space-y-8 pb-6">
      {/* ----------------- Inline create card ----------------- */}
      <section
        aria-labelledby="je-create-heading"
        className="overflow-hidden rounded-xl border bg-card"
      >
        <header className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="uppercase tracking-[0.22em]">Accounting</Badge>
              <Badge variant="info">New entry</Badge>
            </div>
            <h2 id="je-create-heading" className="text-xl font-semibold tracking-tight">
              Create a journal entry
            </h2>
            <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
              Compose a balanced draft. The entry number is allocated server-side when saved; the
              preview below shows the value that will be assigned next.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>↵</Kbd>
              <span className="text-xs">save draft</span>
            </KbdGroup>
            <span className="opacity-60">·</span>
            <KbdGroup>
              <Kbd>⇧</Kbd>
              <Kbd>↵</Kbd>
              <span className="text-xs">add line</span>
            </KbdGroup>
          </div>
        </header>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="space-y-6 px-6 py-6"
          aria-busy={submitting || undefined}
        >
          {/* Header fields */}
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
            <FieldShell label="Entry date" htmlFor="je-date">
              <Input
                id="je-date"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                required
              />
            </FieldShell>
            <FieldShell label="Reference" htmlFor="je-reference">
              <ReferenceCombobox
                id="je-reference"
                value={reference}
                onValueChange={setReference}
              />
            </FieldShell>
            <FieldShell label="Description" htmlFor="je-description">
              <Textarea
                id="je-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Memo describing this entry"
                rows={2}
                className="min-h-9"
              />
            </FieldShell>
          </div>

          {/* Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Lines
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus aria-hidden /> Add line
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <Table variant="default">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[34%]">Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-32 text-right">Debit</TableHead>
                    <TableHead className="w-32 text-right">Credit</TableHead>
                    <TableHead className="w-12" aria-label="row actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={line.key} data-line-row>
                      <TableCell className="align-top">
                        <AccountCombobox
                          id={`je-line-${index}-account`}
                          accounts={accounts}
                          value={line.accountId}
                          onValueChange={(next) => updateLine(index, { accountId: next })}
                          ariaInvalid={!line.accountId && submitting}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          value={line.description}
                          onChange={(event) =>
                            updateLine(index, { description: event.target.value })
                          }
                          placeholder="Line memo"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Input
                          value={line.debit}
                          onChange={(event) => updateLine(index, { debit: event.target.value })}
                          onKeyDown={(event) => handleAmountKeyDown(event, index, 'debit')}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="text-right font-mono"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Input
                          value={line.credit}
                          onChange={(event) => updateLine(index, { credit: event.target.value })}
                          onKeyDown={(event) => handleAmountKeyDown(event, index, 'credit')}
                          inputMode="decimal"
                          placeholder="0.00"
                          className="text-right font-mono"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove line"
                          disabled={lines.length <= 2}
                          onClick={() => removeLine(index)}
                        >
                          <X aria-hidden />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {errors.lines ? (
              <p className="text-xs" style={{ color: 'var(--destructive)' }}>
                {errors.lines}
              </p>
            ) : null}
          </div>

          {/* Balance footer */}
          <div
            className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
            style={{
              background: 'color-mix(in srgb, var(--card) 92%, #f3efe7 8%)',
              borderColor: totals.balanced
                ? 'color-mix(in srgb, var(--border) 60%, var(--success) 40%)'
                : 'color-mix(in srgb, var(--border) 60%, var(--warning) 40%)',
            }}
          >
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Total debits</div>
              <div className="text-xl font-semibold tabular-nums">${totals.debits}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Total credits</div>
              <div className="text-xl font-semibold tabular-nums">${totals.credits}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Balance</div>
              <div className="text-xl font-semibold tabular-nums">
                {totals.balanced ? (
                  <Badge variant="success">Balanced</Badge>
                ) : (
                  <span>
                    <Badge variant="warning">Unbalanced</Badge>{' '}
                    <span className="ml-1 text-sm text-[var(--muted-foreground)]">
                      need ${totals.difference} on {totals.side} side
                    </span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 self-end">
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Reset
              </Button>
              <Button type="submit" disabled={!canSubmit || submitting}>
                {submitting ? 'Saving…' : 'Save draft'}
              </Button>
            </div>
          </div>
        </form>
      </section>

      {/* ----------------- Recent entries ----------------- */}
      <section aria-labelledby="je-recent-heading" className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 id="je-recent-heading" className="text-xl font-semibold tracking-tight">
              Recent journal entries
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Drafts can be edited, posted, or deleted. Posted entries can be reversed; reversals
              create a new Posted entry that swaps debits and credits.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search number, memo, reference"
                className="w-72 pl-9"
                type="search"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border bg-[var(--card)] p-1">
              {STATUS_FILTERS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={statusFilter === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="overflow-hidden rounded-xl border bg-card">
          <Table variant="card">
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Entry</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-32">Reference</TableHead>
                <TableHead className="w-28 text-right">Debits</TableHead>
                <TableHead className="w-28 text-right">Credits</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Source</TableHead>
                <TableHead className="w-44 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEntries && entries.length === 0
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <TableRow key={`skel-${idx}`}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : null}
              {!loadingEntries && entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="p-0">
                    <Empty className="py-12 md:py-14">
                      <EmptyHeader>
                        <EmptyTitle>No journal entries match</EmptyTitle>
                        <EmptyDescription>
                          Try a different search or status filter, or create a new entry above.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : null}
              {entries.map((entry) => {
                const pending = actionPendingId === entry.id;
                return (
                  <TableRow key={entry.id} className="group">
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/journal-entries/${entry.id}`}
                        className="font-mono text-sm underline-offset-4 hover:underline"
                      >
                        {entry.entryNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted-foreground)]">
                      {entry.entryDate}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{entry.description ?? 'No description'}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">
                        {entry.lineCount} lines
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--muted-foreground)]">
                      {entry.reference ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      ${formatAmount(entry.totalDebits)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      ${formatAmount(entry.totalCredits)}
                    </TableCell>
                    <TableCell>
                      <JournalEntryStatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" size="sm">
                        {entry.sourceModule ?? 'manual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/journal-entries/${entry.id}`}>
                          <Button variant="secondary" size="xs" disabled={pending}>
                            View
                          </Button>
                        </Link>
                        {entry.status === 'Draft' ? (
                          <>
                            <Button
                              type="button"
                              variant="default"
                              size="xs"
                              onClick={() => handlePost(entry.id)}
                              disabled={pending}
                            >
                              Post
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Delete draft"
                              onClick={() => handleDelete(entry.id)}
                              disabled={pending}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </>
                        ) : null}
                        {entry.status === 'Posted' ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => handleReverse(entry.id)}
                            disabled={pending}
                          >
                            Reverse
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-6 py-3 text-xs text-[var(--muted-foreground)]">
            <span>
              {loadingEntries ? 'Loading…' : `${entries.length} entries shown`}
            </span>
            <button
              type="button"
              onClick={loadEntries}
              className="inline-flex items-center gap-1 text-xs hover:text-foreground"
            >
              <ChevronLeft aria-hidden className="size-3 rotate-90" /> Refresh{' '}
              <ChevronRight aria-hidden className="size-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

type FieldShellProps = {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
};

function FieldShell({ label, htmlFor, children }: FieldShellProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
