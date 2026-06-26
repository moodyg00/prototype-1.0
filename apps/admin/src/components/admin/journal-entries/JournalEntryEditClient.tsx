'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { JournalEntryDetailActions } from '@/src/components/admin/journal-entries/JournalEntryDetailActions';
import { JournalEntryStatusBadge } from '@/src/components/admin/journal-entries/JournalEntryStatusBadge';
import { ReferenceCombobox } from '@/src/components/admin/journal-entries/ReferenceCombobox';
import { add, formatAmount, isBalanced, sub, sum, toDecimal } from '@/src/lib/accounting/money';

type LineDraft = {
  key: string;
  accountId: string | null;
  description: string;
  debit: string;
  credit: string;
};

type EntryDetail = {
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
  updatedAt: string | null;
  reversesEntryId: string | null;
  reversedById: string | null;
  lineCount: number;
  lines: Array<{
    id: string;
    position: number;
    description: string | null;
    debit: string;
    credit: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
  }>;
};

function makeKey() {
  return Math.random().toString(36).slice(2, 9);
}

function parseAmount(value: string): string {
  const trimmed = value.trim();
  return trimmed.length === 0 ? '0' : trimmed;
}

function linesFromEntry(entry: EntryDetail): LineDraft[] {
  return entry.lines.map((line) => ({
    key: line.id || makeKey(),
    accountId: line.accountId,
    description: line.description ?? '',
    debit: line.debit === '0.00' || line.debit === '0' ? '' : line.debit,
    credit: line.credit === '0.00' || line.credit === '0' ? '' : line.credit,
  }));
}

function blankLine(): LineDraft {
  return { key: makeKey(), accountId: null, description: '', debit: '', credit: '' };
}

type Props = {
  entry: EntryDetail;
  accounts: ReadonlyArray<AccountOption>;
};

export function JournalEntryEditClient({ entry, accounts }: Props): React.ReactElement {
  const router = useRouter();
  const isDraft = entry.status === 'Draft';
  const isBankSourced = entry.sourceModule === 'bank_transactions';

  const [entryDate, setEntryDate] = React.useState(entry.entryDate);
  const [reference, setReference] = React.useState(entry.reference ?? '');
  const [description, setDescription] = React.useState(entry.description ?? '');
  const [lines, setLines] = React.useState<LineDraft[]>(() =>
    entry.lines.length > 0 ? linesFromEntry(entry) : [blankLine(), blankLine()],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const totals = React.useMemo(() => {
    const debits = sum(lines.map((line) => parseAmount(line.debit)));
    const credits = sum(lines.map((line) => parseAmount(line.credit)));
    const balanced = isBalanced(debits, credits);
    const difference = sub(debits, credits);
    return {
      debits: formatAmount(debits),
      credits: formatAmount(credits),
      balanced,
      difference: formatAmount(difference.abs()),
      hasAmounts: !toDecimal(debits).isZero() || !toDecimal(credits).isZero(),
    };
  }, [lines]);

  const canSubmit =
    isDraft &&
    totals.balanced &&
    totals.hasAmounts &&
    lines.length >= 2 &&
    lines.every((line) => line.accountId);

  const updateLine = React.useCallback((index: number, patch: Partial<LineDraft>) => {
    setLines((current) => {
      const next = [...current];
      const merged = { ...next[index], ...patch };
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

  const handleSave = React.useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setErrors({});
    try {
      const response = await fetch(`/api/admin/journal-entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate,
          description: description.trim() || null,
          reference: reference.trim() || null,
          lines: lines.map((line) => ({
            accountId: line.accountId!,
            description: line.description.trim() || null,
            debit: parseAmount(line.debit),
            credit: parseAmount(line.credit),
          })),
        }),
      });
      const body = (await response.json()) as { error?: string; details?: { fieldErrors?: Record<string, string[]> } };
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
      toast.success('Draft saved');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save journal entry.');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, entry.id, entryDate, description, reference, lines, router]);

  const balanced = isBalanced(entry.totalDebits, entry.totalCredits);

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Source" value={entry.sourceModule ?? 'manual'} />
        <MetricCard label="Entry number" value={entry.entryNumber} mono />
        <MetricCard label="Total debits" value={`$${formatAmount(entry.totalDebits)}`} mono />
        <MetricCard label="Total credits" value={`$${formatAmount(entry.totalCredits)}`} mono />
      </div>

      {isDraft ? (
        <div className="space-y-6 rounded-xl border bg-card px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Edit draft</div>
              <div className="text-xs text-[var(--muted-foreground)]">
                Update lines and references before posting.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" render={<Link href="/admin/ledger" />}>
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

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
            <FieldShell label="Entry date" htmlFor="je-edit-date">
              <Input
                id="je-edit-date"
                type="date"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                required
              />
            </FieldShell>
            <FieldShell label="Reference" htmlFor="je-edit-reference">
              {isBankSourced ? (
                <Input id="je-edit-reference" value={reference} readOnly className="font-mono" />
              ) : (
                <ReferenceCombobox
                  id="je-edit-reference"
                  value={reference}
                  onValueChange={setReference}
                />
              )}
            </FieldShell>
            <FieldShell label="Description" htmlFor="je-edit-description">
              <Textarea
                id="je-edit-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                className="min-h-9"
              />
            </FieldShell>
          </div>

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
                    <TableRow key={line.key}>
                      <TableCell className="align-top">
                        <AccountCombobox
                          accounts={accounts}
                          value={line.accountId}
                          onValueChange={(next) => updateLine(index, { accountId: next })}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          value={line.description}
                          onChange={(event) => updateLine(index, { description: event.target.value })}
                          placeholder="Line memo"
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Input
                          value={line.debit}
                          onChange={(event) => updateLine(index, { debit: event.target.value })}
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
              <p className="text-xs text-[var(--destructive)]">{errors.lines}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-[var(--muted-foreground)]">
              Debits ${totals.debits} · Credits ${totals.credits}
              {!totals.balanced ? ` · Off by $${totals.difference}` : null}
            </div>
            <Button disabled={!canSubmit || submitting} onClick={() => void handleSave()}>
              {submitting ? 'Saving…' : 'Save draft'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Reference" value={entry.reference ?? '—'} />
            <MetricCard label="Memo" value={entry.description ?? 'No description provided.'} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-5 py-4">
            <div className="text-sm text-[var(--muted-foreground)]">Posted entries are read-only.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" render={<Link href="/admin/ledger" />}>
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
                      <Link href={`/admin/chart-of-accounts/${line.accountId}`} className="font-mono text-sm underline-offset-4 hover:underline">
                        {line.accountCode}
                      </Link>
                      <span className="px-1.5 text-[var(--muted-foreground)]">·</span>
                      {line.accountName}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--muted-foreground)]">
                      {line.description ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatAmount(line.debit)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{formatAmount(line.credit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function FieldShell({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</div>
      <div className={`mt-2 text-lg font-semibold break-all ${mono ? 'tabular-nums font-mono' : ''}`}>{value}</div>
    </div>
  );
}
