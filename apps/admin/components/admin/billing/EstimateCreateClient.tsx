'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { BillingDocumentFormShell } from '@/components/admin/billing/BillingDocumentFormShell';
import { BillingDocumentPreview } from '@/components/admin/billing/BillingDocumentPreview';
import { EstimateEditor } from '@/components/admin/billing/EstimateEditor';
import { PrintShell } from '@/components/admin/billing/PrintShell';
import { EstimateMaterialsLivePreview } from '@/src/components/admin/estimates/EstimateMaterialsPanel';
import { formatCurrency } from '@/src/lib/accounting/money';
import {
  emptyState,
  useBillingDocumentForm,
} from '@/src/hooks/admin/useBillingDocumentForm';
import type { BillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';

interface EstimateCreateClientProps {
  bootstrap: BillingCreateBootstrap;
}

export function EstimateCreateClient({
  bootstrap,
}: EstimateCreateClientProps): React.ReactElement {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  const initialState = React.useMemo(
    () =>
      emptyState('estimate', bootstrap.nextNumber, {
        paymentTerms: '50% deposit, balance on completion',
      }),
    [bootstrap.nextNumber],
  );

  const { state, dispatch, errors, submitting, submit, derived } = useBillingDocumentForm({
    initialState,
  });

  const refreshNumber = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/estimates/next-number', { cache: 'no-store' });
      const body = (await response.json()) as { estimateNumber?: string; error?: string };
      if (!response.ok || !body.estimateNumber) {
        throw new Error(body.error ?? 'Could not refresh estimate number.');
      }
      dispatch({ type: 'set', patch: { documentNumber: body.estimateNumber } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not refresh estimate number.');
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const handleSubmit = React.useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      const result = await submit();
      if (!result.ok) {
        toast.error(result.message ?? 'Could not save estimate.');
        return;
      }
      toast.success(`Saved draft ${result.documentNumber ?? state.documentNumber}`);
      if (result.id) {
        router.push(`/admin/estimates/${result.id}`);
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
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <BillingDocumentFormShell
        mode="create"
        kind="estimate"
        eyebrow="New estimate"
        title={state.documentNumber}
        subtitle="Compose a draft estimate. Apply a template to start from a known-good shape."
        backHref="/admin/estimates"
        backLabel="Estimates"
        statusBadge={<Badge variant="info">Draft</Badge>}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/estimates')}
          >
            Cancel
          </Button>
        }
        editor={
          <EstimateEditor
            state={state}
            dispatch={dispatch}
            contacts={bootstrap.contacts}
            organizations={bootstrap.organizations}
            templates={bootstrap.estimateTemplates}
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
              kind="estimate"
              documentNumber={state.documentNumber}
              title={state.title || null}
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
      <EstimateMaterialsLivePreview lineItems={state.lineItems} />
    </form>
  );
}
