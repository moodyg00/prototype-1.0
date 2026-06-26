'use client';

import * as React from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';

type ValidityFieldsetProps = {
  validUntil: string;
  disabled?: boolean;
  errors?: Record<string, string>;
  onChange: (value: string) => void;
};

/**
 * Estimate-only fieldset: how long the offer stays valid. Kept in its own
 * component so the create flow and the edit-mode detail page can swap copy
 * without touching the rest of the form.
 */
export function ValidityFieldset({
  validUntil,
  disabled,
  errors,
  onChange,
}: ValidityFieldsetProps): React.ReactElement {
  return (
    <FieldsetSurface
      eyebrow="Validity"
      title="Offer window"
      description="How long this estimate stays valid. After this date the customer-facing copy switches to expired."
    >
      <Field>
        <FieldLabel>Valid until</FieldLabel>
        <Input
          type="date"
          value={validUntil}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-invalid={errors?.validUntil ? true : undefined}
        />
        {errors?.validUntil ? <FieldError>{errors.validUntil}</FieldError> : null}
        <FieldDescription>
          Defaults to 30 days from the issue date — adjust per project.
        </FieldDescription>
      </Field>
    </FieldsetSurface>
  );
}
