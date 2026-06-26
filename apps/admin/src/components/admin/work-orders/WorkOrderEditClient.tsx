'use client';

import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AttachmentPanel } from '@/src/components/admin/attachments/AttachmentPanel';
import type { AttachmentSummary } from '@/src/lib/attachments/attachment-service';
import type { WorkOrderBootstrap } from '@/src/lib/operations/work-order-bootstrap';
import type { WorkOrderMaterialDetail } from '@/src/lib/operations/accept-estimate';
import type { WorkOrderDetail } from '@/src/lib/operations/work-order-service';
import { workOrderUpdateSchema } from '@/src/lib/validation/work-orders';

import { WorkOrderMaterialsPanel } from './WorkOrderMaterialsPanel';
import {
  WorkOrderForm,
  workOrderFormFromDetail,
  workOrderPayloadFromState,
} from './WorkOrderForm';

export function WorkOrderEditClient({
  bootstrap,
  workOrder: initial,
  materials,
  attachments,
}: {
  bootstrap: WorkOrderBootstrap;
  workOrder: WorkOrderDetail;
  materials: ReadonlyArray<WorkOrderMaterialDetail>;
  attachments: AttachmentSummary[];
}): React.ReactElement {
  const [workOrder, setWorkOrder] = React.useState(initial);
  const [state, setState] = React.useState(() => workOrderFormFromDetail(initial));
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const payload = workOrderPayloadFromState(state);
    const parsed = workOrderUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form';
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error('Fix the highlighted fields before saving.');
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/work-orders/${workOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as { workOrder?: WorkOrderDetail; error?: string };
      if (!res.ok || !body.workOrder) throw new Error(body.error ?? 'Could not save work order.');
      setWorkOrder(body.workOrder);
      setState(workOrderFormFromDetail(body.workOrder));
      toast.success(`Saved ${body.workOrder.workOrderNumber}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save work order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{workOrder.workOrderNumber}</h1>
            <Badge variant="outline" className="capitalize">
              {workOrder.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {workOrder.customerName ?? 'No customer'} · {workOrder.lineItems.length} service
            {workOrder.lineItems.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/work-orders" />}>
            Back
          </Button>
          <Button loading={submitting} onClick={() => void handleSubmit()}>
            Save changes
          </Button>
        </div>
      </header>

      <WorkOrderForm
        state={state}
        onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))}
        contacts={bootstrap.contacts}
        organizations={bootstrap.organizations}
        offerings={bootstrap.offerings}
        disabled={submitting}
        errors={errors}
        workOrderNumber={workOrder.workOrderNumber}
      />

      <WorkOrderMaterialsPanel materials={materials} />

      <AttachmentPanel
        title="Photos"
        description="Photos uploaded to this work order, plus any inherited from its originating lead."
        scope="work_order"
        workOrderId={workOrder.id}
        initialAttachments={attachments}
        allowPhotos
      />
    </div>
  );
}
