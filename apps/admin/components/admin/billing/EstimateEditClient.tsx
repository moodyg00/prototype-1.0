'use client';

import Link from 'next/link';
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
import { EstimateMaterialsLivePreview, EstimateMaterialsPanel } from '@/src/components/admin/estimates/EstimateMaterialsPanel';
import { formatCurrency } from '@/src/lib/accounting/money';
import {
  estimateDetailToFormState,
  useBillingDocumentForm,
} from '@/src/hooks/admin/useBillingDocumentForm';
import type { BillingCreateBootstrap } from '@/src/lib/billing/billing-bootstrap';
import type { EstimateDetail } from '@/src/lib/billing/estimate-service';
import type { EstimateMaterialRow } from '@/src/lib/operations/estimate-materials';

interface EstimateEditClientProps {
  bootstrap: BillingCreateBootstrap;
  estimate: EstimateDetail;
  materials: ReadonlyArray<EstimateMaterialRow>;
  materialsMode: 'preview' | 'snapshot';
}

export function EstimateEditClient({
  bootstrap,
  estimate: initialEstimate,
  materials,
  materialsMode,
}: EstimateEditClientProps): React.ReactElement {
  const router = useRouter();
  const [estimate, setEstimate] = React.useState(initialEstimate);
  const [accepting, setAccepting] = React.useState(false);
  const isDraft = estimate.status === 'draft';
  const canAccept =
    !estimate.convertedWorkOrderId &&
    estimate.status !== 'accepted' &&
    estimate.status !== 'rejected' &&
    estimate.status !== 'expired';

  const initialState = React.useMemo(
    () => estimateDetailToFormState(estimate),
    [estimate],
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
        toast.error(result.message ?? 'Could not save estimate.');
        return;
      }
      toast.success(`Updated ${result.documentNumber ?? state.documentNumber}`);
    },
    [isDraft, state.documentNumber, submit],
  );

  const handleAccept = React.useCallback(async () => {
    if (!canAccept) return;
    if (!state.contactId) {
      toast.error('Select a contact under Customer before accepting this estimate.');
      return;
    }
    if (
      !window.confirm(
        'Accept this estimate and create a work order? Materials will be snapshotted and copied to the work order.',
      )
    ) {
      return;
    }
    setAccepting(true);
    try {
      if (isDraft) {
        const saveResult = await submit('edit');
        if (!saveResult.ok) {
          toast.error(saveResult.message ?? 'Fix validation errors and save before accepting.');
          return;
        }
      }
      const res = await fetch(`/api/admin/estimates/${estimate.id}/accept`, { method: 'POST' });
      const body = (await res.json()) as {
        workOrderId?: string;
        workOrderNumber?: string;
        error?: string;
      };
      if (!res.ok || !body.workOrderId) {
        throw new Error(body.error ?? 'Could not accept estimate.');
      }
      toast.success(`Created ${body.workOrderNumber ?? 'work order'}`);
      router.push(`/admin/work-orders/${body.workOrderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not accept estimate.');
    } finally {
      setAccepting(false);
    }
  }, [canAccept, estimate.id, isDraft, router, state.contactId, submit]);

  const handleDelete = React.useCallback(async () => {
    if (!isDraft) return;
    if (!window.confirm('Delete this draft estimate? This cannot be undone.')) return;
    const response = await fetch(`/api/admin/estimates/${estimate.id}`, { method: 'DELETE' });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      toast.error(body.error ?? 'Could not delete estimate.');
      return;
    }
    toast.success('Draft estimate deleted');
    router.push('/admin/estimates');
  }, [estimate.id, isDraft, router]);

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
        mode="edit"
        kind="estimate"
        eyebrow="Estimate"
        title={state.documentNumber}
        subtitle={
          isDraft
            ? 'Edit this draft before sending it to the customer.'
            : 'This estimate is no longer a draft. Fields are read-only; preview still updates.'
        }
        backHref="/admin/estimates"
        backLabel="Estimates"
        statusBadge={
          <Badge variant={isDraft ? 'info' : 'outline'} className="uppercase tracking-[0.16em]">
            {estimate.status}
          </Badge>
        }
        banner={
          !isDraft ? (
            <span>
              Edits are disabled because this estimate is <strong>{estimate.status}</strong>. Only
              draft estimates can be changed or deleted.
            </span>
          ) : undefined
        }
        actions={
          <>
            {canAccept ? (
              <Button
                type="button"
                size="sm"
                loading={accepting}
                onClick={() => void handleAccept()}
              >
                Accept & create work order
              </Button>
            ) : estimate.convertedWorkOrderId ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                render={<Link href={`/admin/work-orders/${estimate.convertedWorkOrderId}`} />}
              >
                View work order
              </Button>
            ) : null}
            {isDraft ? (
              <Button type="button" variant="ghost" size="sm" onClick={handleDelete}>
                Delete draft
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/estimates')}
            >
              Back to list
            </Button>
          </>
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
            refreshing={false}
            disabled={!isDraft || submitting}
            errors={errors}
            onRefreshNumber={() => {}}
          />
        }
        preview={
          <PrintShell>
            <BillingDocumentPreview
              kind="estimate"
              documentNumber={state.documentNumber}
              status={estimate.status as 'draft'}
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
              {errors.form ? (
                <div className="text-xs" style={{ color: 'var(--destructive)' }}>
                  {errors.form}
                </div>
              ) : null}
            </div>
            {isDraft ? (
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
            ) : (
              <span className="text-xs text-[var(--muted-foreground)]">Read-only</span>
            )}
          </div>
        }
      />
      {materialsMode === 'snapshot' ? (
        <EstimateMaterialsPanel
          estimateId={estimate.id}
          initialMaterials={materials}
          initialMode={materialsMode}
        />
      ) : (
        <EstimateMaterialsLivePreview lineItems={state.lineItems} />
      )}
    </form>
  );
}
