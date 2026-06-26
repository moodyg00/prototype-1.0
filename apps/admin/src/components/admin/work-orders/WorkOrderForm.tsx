'use client';

import * as React from 'react';

import { CustomerFieldset } from '@/components/admin/billing/fieldsets/CustomerFieldset';
import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ContactOption, OrganizationOption, OfferingOption } from '@/src/lib/billing/billing-bootstrap';
import { WORK_ORDER_STATUSES } from '@/src/lib/validation/work-orders';

import {
  newWorkOrderLineRow,
  reorderLineRows,
  WorkOrderLineItemsTable,
  type WorkOrderLineRow,
} from './WorkOrderLineItemsTable';

export type WorkOrderFormState = {
  contactId: string | null;
  contactName: string;
  organizationId: string | null;
  customerName: string;
  contactEmail: string | null;
  status: string;
  scheduledDate: string;
  specialInstructions: string;
  notes: string;
  lineItems: WorkOrderLineRow[];
};

export function emptyWorkOrderFormState(): WorkOrderFormState {
  return {
    contactId: null,
    contactName: '',
    organizationId: null,
    customerName: '',
    contactEmail: null,
    status: 'scheduled',
    scheduledDate: '',
    specialInstructions: '',
    notes: '',
    lineItems: [newWorkOrderLineRow()],
  };
}

export function workOrderFormFromDetail(detail: {
  contactId: string;
  customerName: string | null;
  status: string;
  scheduledDate: string | null;
  specialInstructions: string | null;
  notes: string | null;
  lineItems: Array<{
    id: string;
    serviceId: string | null;
    description: string;
    quantity: string;
    notes: string | null;
  }>;
}): WorkOrderFormState {
  return {
    contactId: detail.contactId,
    contactName: detail.customerName ?? '',
    organizationId: null,
    customerName: detail.customerName ?? '',
    contactEmail: null,
    status: detail.status,
    scheduledDate: detail.scheduledDate ?? '',
    specialInstructions: detail.specialInstructions ?? '',
    notes: detail.notes ?? '',
    lineItems:
      detail.lineItems.length > 0
        ? detail.lineItems.map((item) => ({
            key: item.id,
            serviceId: item.serviceId,
            description: item.description,
            quantity: item.quantity,
            notes: item.notes ?? '',
          }))
        : [newWorkOrderLineRow()],
  };
}

export function WorkOrderForm({
  state,
  onChange,
  contacts,
  organizations,
  offerings,
  disabled,
  errors,
  workOrderNumber,
}: {
  state: WorkOrderFormState;
  onChange: (patch: Partial<WorkOrderFormState>) => void;
  contacts: ReadonlyArray<ContactOption>;
  organizations: ReadonlyArray<OrganizationOption>;
  offerings: ReadonlyArray<OfferingOption>;
  disabled?: boolean;
  errors?: Record<string, string>;
  workOrderNumber?: string;
}): React.ReactElement {
  return (
    <div className="space-y-6">
      {workOrderNumber ? (
        <FieldsetSurface title="Work order" description="Execution record — services only, no customer pricing.">
          <Field>
            <FieldLabel>Number</FieldLabel>
            <Input value={workOrderNumber} readOnly />
          </Field>
        </FieldsetSurface>
      ) : null}

      <CustomerFieldset
        contacts={contacts}
        organizations={organizations}
        contactId={state.contactId}
        organizationId={state.organizationId}
        contactName={state.contactName}
        organizationName=""
        contactEmail={state.contactEmail}
        disabled={disabled}
        onSelectContact={(contact) =>
          onChange({
            contactId: contact?.id ?? null,
            contactName: contact?.name ?? '',
            contactEmail: contact?.email ?? null,
            customerName: contact?.name ?? state.customerName,
            organizationId: contact?.organizationId ?? state.organizationId,
          })
        }
        onSelectOrganization={(org) =>
          onChange({
            organizationId: org?.id ?? null,
          })
        }
      />

      <FieldsetSurface
        eyebrow="Services"
        title="Service lines"
        description="Add every service this work order covers. Quantity is how many units of that service (e.g. rooms, systems, visits)."
      >
        <WorkOrderLineItemsTable
          rows={state.lineItems}
          offerings={offerings}
          disabled={disabled}
          errors={errors}
          onAdd={() => onChange({ lineItems: [...state.lineItems, newWorkOrderLineRow()] })}
          onRemove={(key) => onChange({ lineItems: state.lineItems.filter((row) => row.key !== key) })}
          onChange={(key, patch) =>
            onChange({
              lineItems: state.lineItems.map((row) => (row.key === key ? { ...row, ...patch } : row)),
            })
          }
          onReorder={(sourceKey, targetKey) =>
            onChange({ lineItems: reorderLineRows(state.lineItems, sourceKey, targetKey) })
          }
        />
      </FieldsetSurface>

      <FieldsetSurface title="Scheduling" description="When and how the crew should execute this order.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              value={state.status}
              onValueChange={(value) => onChange({ status: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {WORK_ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Scheduled date</FieldLabel>
            <Input
              type="date"
              value={state.scheduledDate}
              disabled={disabled}
              onChange={(event) => onChange({ scheduledDate: event.target.value })}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel>Special instructions</FieldLabel>
          <Textarea
            value={state.specialInstructions}
            disabled={disabled}
            rows={3}
            onChange={(event) => onChange({ specialInstructions: event.target.value })}
            placeholder="Access codes, parking, customer preferences…"
          />
        </Field>
        <Field>
          <FieldLabel>Internal notes</FieldLabel>
          <Textarea
            value={state.notes}
            disabled={disabled}
            rows={3}
            onChange={(event) => onChange({ notes: event.target.value })}
            placeholder="Dispatch context or scope notes for the crew."
          />
        </Field>
      </FieldsetSurface>
    </div>
  );
}

export function workOrderPayloadFromState(state: WorkOrderFormState) {
  return {
    contactId: state.contactId,
    contactName: state.contactName.trim() || null,
    organizationId: state.organizationId,
    customerName: state.customerName.trim() || state.contactName.trim() || null,
    status: state.status,
    scheduledDate: state.scheduledDate || null,
    specialInstructions: state.specialInstructions.trim() || null,
    notes: state.notes.trim() || null,
    lineItems: state.lineItems.map((line) => ({
      serviceId: line.serviceId,
      description: line.description.trim(),
      quantity: line.quantity.trim() || '1',
      notes: line.notes.trim() || null,
    })),
  };
}
