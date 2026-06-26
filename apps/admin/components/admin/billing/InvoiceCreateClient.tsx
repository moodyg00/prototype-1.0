'use client';

import { format } from 'date-fns';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { BillingDocumentFormShell } from '@/components/admin/billing/BillingDocumentFormShell';
import { BillingDocumentPreview } from '@/components/admin/billing/BillingDocumentPreview';
import { InvoiceEditor } from '@/components/admin/billing/InvoiceEditor';
import { PrintShell } from '@/components/admin/billing/PrintShell';
import { formatCurrency } from '@/src/lib/accounting/money';
import {
  emptyState,
  useBillingDocumentForm,
} from '@/src/hooks/admin/useBillingDocumentForm';
import type { BillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';

interface InvoiceCreateClientProps {
  bootstrap: BillingCreateBootstrap;
}

function netDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return format(date, 'yyyy-MM-dd');
}

export function InvoiceCreateClient({ bootstrap }: InvoiceCreateClientProps): React.ReactElement {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const initialState = React.useMemo(
    () =>
      emptyState('invoice', bootstrap.nextNumber, {
        paymentTerms: 'Net 30',
        dueDate: netDaysIso(30),
      }),
    [bootstrap.nextNumber],
  );

  const { state, dispatch, errors, submitting, submit, derived } = useBillingDocumentForm({
    initialState,
  });

  const refreshNumber = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/invoices/next-number', { cache: 'no-store' });
      const body = (await response.json()) as { invoiceNumber?: string; error?: string };
      if (!response.ok || !body.invoiceNumber) {
        throw new Error(body.error ?? 'Could not refresh invoice number.');
      }
      dispatch({ type: 'set', patch: { documentNumber: body.invoiceNumber } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh invoice number.');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const handleSubmit = React.useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      const result = await submit();
      if (!result.ok) {
        toast.error(result.message ?? 'Could not save invoice.');
        return;
      }
      toast.success(`Saved draft ${result.documentNumber ?? state.documentNumber}`);
      if (result.id) {
        router.push(`/admin/invoices/${result.id}`);
      }
    },
    [router, state.documentNumber, submit],
  );

  const previewLines = React.useMemo(
    () =>
      state.lineItems.map((line) => ({
        id: line.key,
        description: line.description,
        quantity: line.quantity || '0',
        unitPrice: line.unitPrice || '0',
        isBillable: line.isBillable !== false,
        total: derived.lineTotals.get(line.key) ?? '0',
      })),
    [derived.lineTotals, state.lineItems],
  );

  return (
    <form onSubmit={handleSubmit}>
      <BillingDocumentFormShell
        mode="create"
        kind="invoice"
        eyebrow="New invoice"
        title={state.documentNumber}
        subtitle="Compose a draft invoice. The number is allocated atomically when you save."
        backHref="/admin/invoices"
        backLabel="Invoices"
        statusBadge={<Badge variant="info">Draft</Badge>}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/invoices')}
          >
            Cancel
          </Button>
        }
        editor={
          <InvoiceEditor
            state={state}
            dispatch={dispatch}
            contacts={bootstrap.contacts}
            organizations={bootstrap.organizations}
            offerings={bootstrap.offerings}
            products={bootstrap.products}
            materials={bootstrap.materials}
            refreshing={refreshing}
            disabled={submitting}
            errors={errors}
            onRefreshNumber={refreshNumber}
          />
        }
        preview={
          <PrintShell>
            <BillingDocumentPreview
              kind="invoice"
              documentNumber={state.documentNumber}
              issueDate={state.issueDate}
              dueDate={state.dueDate}
              contactName={state.contactName || null}
              contactEmail={state.contactEmail}
              organizationName={state.organizationName || null}
              paymentTerms={state.paymentTerms || null}
              notes={state.notes || null}
              lines={previewLines}
              subtotal={derived.subtotal}
              discountLabel={derived.discountLabel}
              discountAmount={derived.discountAmount}
              taxLabel={derived.taxLabel}
              taxAmount={derived.taxAmount}
              total={derived.total}
            />
          </PrintShell>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div>
                <span
                  className="block text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  Total
                </span>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {formatCurrency(derived.total)}
                </span>
              </div>
              <div className="hidden text-xs text-[var(--muted-foreground)] sm:block">
                Subtotal {formatCurrency(derived.subtotal)}
                {derived.discountLabel ? ` · ${derived.discountLabel}` : ''}
                {derived.taxLabel ? ` · ${derived.taxLabel}` : ''}
              </div>
              {errors.form ? (
                <div className="text-xs" style={{ color: 'var(--destructive)' }}>
                  {errors.form}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
                <span className="text-xs">save draft</span>
              </KbdGroup>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save draft'}
              </Button>
            </div>
          </div>
        }
      />
    </form>
  );
}
