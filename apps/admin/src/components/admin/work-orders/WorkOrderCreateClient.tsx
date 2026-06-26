'use client';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WorkOrderBootstrap } from '@/src/lib/operations/work-order-bootstrap';
import { workOrderCreateSchema } from '@/src/lib/validation/work-orders';

import {
  emptyWorkOrderFormState,
  WorkOrderForm,
  workOrderPayloadFromState,
} from './WorkOrderForm';

export function WorkOrderCreateClient({
  bootstrap,
}: {
  bootstrap: WorkOrderBootstrap;
}): React.ReactElement {
  const router = useRouter();
  const [state, setState] = React.useState(emptyWorkOrderFormState);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    const payload = workOrderPayloadFromState(state);
    const parsed = workOrderCreateSchema.safeParse(payload);
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
      const res = await fetch('/api/admin/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const body = (await res.json()) as { workOrder?: { id: string; workOrderNumber: string }; error?: string };
      if (!res.ok || !body.workOrder) throw new Error(body.error ?? 'Could not create work order.');
      toast.success(`Created ${body.workOrder.workOrderNumber}`);
      router.push(`/admin/work-orders/${body.workOrder.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create work order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">New work order</h1>
            <Badge variant="outline">Operations</Badge>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Standalone work order with multiple service lines. No customer pricing on this record.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/work-orders" />}>
            Cancel
          </Button>
          <Button loading={submitting} onClick={() => void handleSubmit()}>
            Create work order
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
      />
    </div>
  );
}
