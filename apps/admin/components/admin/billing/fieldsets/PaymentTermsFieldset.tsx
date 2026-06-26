'use client';

import * as React from 'react';

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';

type PaymentTermsFieldsetProps = {
  paymentTerms: string;
  notes: string;
  internalNotes: string;
  disabled?: boolean;
  onPaymentTermsChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onInternalNotesChange: (value: string) => void;
};

export function PaymentTermsFieldset({
  paymentTerms,
  notes,
  internalNotes,
  disabled,
  onPaymentTermsChange,
  onNotesChange,
  onInternalNotesChange,
}: PaymentTermsFieldsetProps): React.ReactElement {
  return (
    <FieldsetSurface
      eyebrow="Notes"
      title="Payment terms and messaging"
      description="Public copy lands on the customer-facing document. Internal notes never leave the admin."
    >
      <Field>
        <FieldLabel>Payment terms</FieldLabel>
        <Input
          value={paymentTerms}
          onChange={(event) => onPaymentTermsChange(event.target.value)}
          placeholder="Net 30, due upon receipt, etc."
          disabled={disabled}
        />
      </Field>
      <Field>
        <FieldLabel>Customer-facing notes</FieldLabel>
        <Textarea
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          rows={3}
          placeholder="Thank-you message, project context, or terms summary."
          disabled={disabled}
        />
      </Field>
      <Field>
        <FieldLabel>Internal notes</FieldLabel>
        <Textarea
          value={internalNotes}
          onChange={(event) => onInternalNotesChange(event.target.value)}
          rows={2}
          placeholder="Only visible to admins. Pricing rationale, special terms, etc."
          disabled={disabled}
        />
        <FieldDescription>Stored in the document’s `metadata` payload.</FieldDescription>
      </Field>
    </FieldsetSurface>
  );
}
