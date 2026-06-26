'use client';

import * as React from 'react';

import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';

type DiscountFieldsetProps = {
  discountType: 'amount' | 'percent' | null;
  discountValue: string;
  taxRate: string;
  disabled?: boolean;
  errors?: Record<string, string>;
  onDiscountTypeChange: (value: 'amount' | 'percent' | null) => void;
  onDiscountValueChange: (value: string) => void;
  onTaxRateChange: (value: string) => void;
};

export function DiscountFieldset({
  discountType,
  discountValue,
  taxRate,
  disabled,
  errors,
  onDiscountTypeChange,
  onDiscountValueChange,
  onTaxRateChange,
}: DiscountFieldsetProps): React.ReactElement {
  const typeValue = discountType ?? 'none';
  return (
    <FieldsetSurface
      eyebrow="Adjustments"
      title="Discount and tax"
      description="Apply a document-level discount and tax rate. Percent discounts are applied to the subtotal; tax is applied to the post-discount total."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel>Discount type</FieldLabel>
          <Select
            value={typeValue}
            onValueChange={(next) =>
              onDiscountTypeChange(next === 'none' ? null : (next as 'amount' | 'percent'))
            }
            disabled={disabled}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="none">No discount</SelectItem>
              <SelectItem value="amount">Flat amount</SelectItem>
              <SelectItem value="percent">Percent</SelectItem>
            </SelectPopup>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Discount value</FieldLabel>
          <Input
            value={discountValue}
            onChange={(event) => onDiscountValueChange(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            disabled={disabled || !discountType}
            className="font-mono"
            aria-invalid={errors?.discountValue ? true : undefined}
          />
          {errors?.discountValue ? <FieldError>{errors.discountValue}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel>Tax rate (%)</FieldLabel>
          <Input
            value={taxRate}
            onChange={(event) => onTaxRateChange(event.target.value)}
            inputMode="decimal"
            placeholder="0"
            disabled={disabled}
            className="font-mono"
            aria-invalid={errors?.taxRate ? true : undefined}
          />
          {errors?.taxRate ? <FieldError>{errors.taxRate}</FieldError> : null}
        </Field>
      </div>
    </FieldsetSurface>
  );
}
