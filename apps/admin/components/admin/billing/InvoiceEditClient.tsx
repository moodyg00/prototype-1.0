'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { BillingDocumentFormShell } from '@/components/admin/billing/BillingDocumentFormShell';
import { BillingDocumentPreview } from '@/components/admin/billing/BillingDocumentPreview';
import { InvoiceEditor } from '@/components/admin/billing/InvoiceEditor';
import { PrintShell } from '@/components/admin/billing/PrintShell';
import { formatCurrency } from '@/src/lib/accounting/money';
import {
  invoiceDetailToFormState,
  useBillingDocumentForm,
} from '@/src/hooks/admin/useBillingDocumentForm';
import type { BillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';
import type { InvoiceDetail } from '@/src/lib/billing/invoice-service';

interface InvoiceEditClientProps {
  bootstrap: BillingCreateBootstrap;
  invoice: InvoiceDetail;
}

export function InvoiceEditClient({
  bootstrap,
  invoice,
}: InvoiceEditClientProps): React.ReactElement {
  const router = useRouter();
  const isDraft = invoice.status === 'draft';

  const initialState = React.useMemo(
    () => invoiceDetailToFormState(invoice),
    [invoice],
  );

  const { state, dispatch, errors, submitting, submit, derived } = useBillingDocumentForm({
    initialState,
    mode: 'edit',
  });

  const handleSubmit = React.useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!isDraft) return;
      const result = await submit('edit');
      if (!result.ok) {
        toast.error(result.message ?? 'Could not save invoice.');
        return;
      }
      toast.success(`Saved ${result.documentNumber ?? state.documentNumber}`);
    },
    [isDraft, state.documentNumber, submit],
  );

  const handleDelete = React.useCallback(async () => {
    if (!isDraft || !window.confirm('Delete this draft invoice?')) return;
    const response = await fetch(`/api/admin/invoices/${invoice.id}`, { method: 'DELETE' });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      toast.error(body.error ?? 'Could not delete invoice.');
      return;
    }
    toast.success('Draft invoice deleted');
    router.push('/admin/invoices');
  }, [invoice.id, isDraft, router]);

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
        mode="edit"
        kind="invoice"
        eyebrow="Invoice"
        title={state.documentNumber}
        subtitle={
          isDraft
            ? 'Edit this draft invoice before sending it to the customer.'
            : 'This invoice is no longer a draft — fields are read-only.'
        }
        backHref="/admin/invoices"
        backLabel="Invoices"
        statusBadge={
          <Badge variant={isDraft ? 'info' : 'outline'} className="uppercase tracking-[0.18em]">
            {invoice.status}
          </Badge>
        }
        banner={
          !isDraft ? (
            <Alert variant="warning">
              <AlertTitle>Read-only</AlertTitle>
              <AlertDescription>
                Only draft invoices can be edited. This invoice is{' '}
                <strong>{invoice.status}</strong>. The preview still reflects the saved document.
              </AlertDescription>
            </Alert>
          ) : null
        }
        actions={
          isDraft ? (
            <Button type="button" variant="outline" size="sm" onClick={handleDelete}>
              Delete draft
            </Button>
          ) : null
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
            refreshing={false}
            disabled={!isDraft || submitting}
            errors={errors}
            onRefreshNumber={() => {}}
          />
        }
        preview={
          <PrintShell>
            <BillingDocumentPreview
              kind="invoice"
              documentNumber={state.documentNumber}
              status={invoice.status as 'draft'}
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
          isDraft ? (
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
                  <span className="text-xs">save</span>
                </KbdGroup>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end text-sm text-[var(--muted-foreground)]">
              Total {formatCurrency(derived.total)} (read-only)
            </div>
          )
        }
      />
    </form>
  );
}
