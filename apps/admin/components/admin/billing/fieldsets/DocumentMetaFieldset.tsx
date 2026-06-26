'use client';

import { RefreshCw } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { FieldsetSurface } from '@/components/admin/billing/FieldsetSurface';

type DocumentMetaFieldsetProps = {
  kind: 'invoice' | 'estimate';
  documentNumber: string;
  issueDate: string;
  /** Invoice → due date. Estimate → valid until. */
  dueDate: string;
  /** Estimate-only. */
  title?: string;
  refreshing?: boolean;
  disabled?: boolean;
  errors?: Record<string, string>;
  onTitleChange?: (value: string) => void;
  onIssueDateChange: (value: string) => void;
  onDueDateChange: (value: string) => void;
  onRefreshNumber: () => void;
};

export function DocumentMetaFieldset({
  kind,
  documentNumber,
  issueDate,
  dueDate,
  title,
  refreshing,
  disabled,
  errors,
  onTitleChange,
  onIssueDateChange,
  onDueDateChange,
  onRefreshNumber,
}: DocumentMetaFieldsetProps): React.ReactElement {
  const numberLabel = kind === 'invoice' ? 'Invoice number' : 'Estimate number';
  const dueLabel = kind === 'invoice' ? 'Due date' : 'Valid until';
  return (
    <FieldsetSurface
      eyebrow="Details"
      title="Document"
      description={
        kind === 'invoice'
          ? 'When and how the customer should pay.'
          : 'When the estimate was prepared and how long it stays valid.'
      }
    >
      {kind === 'estimate' ? (
        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={title ?? ''}
            onChange={(event) => onTitleChange?.(event.target.value)}
            placeholder="e.g. Annual roof maintenance"
            disabled={disabled}
            required
            aria-invalid={errors?.title ? true : undefined}
          />
          {errors?.title ? <FieldError>{errors.title}</FieldError> : null}
        </Field>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field>
          <FieldLabel>{numberLabel}</FieldLabel>
          <div className="flex w-full items-center gap-2">
            <Input value={documentNumber} readOnly className="font-mono" />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onRefreshNumber}
              disabled={disabled}
              aria-label="Refresh next number preview"
              title="Refresh preview"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : undefined} />
            </Button>
          </div>
          <FieldDescription>Allocated on save (server-side).</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Issue date</FieldLabel>
          <Input
            type="date"
            value={issueDate}
            onChange={(event) => onIssueDateChange(event.target.value)}
            disabled={disabled}
            required
            aria-invalid={errors?.issueDate ? true : undefined}
          />
          {errors?.issueDate ? <FieldError>{errors.issueDate}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel>{dueLabel}</FieldLabel>
          <Input
            type="date"
            value={dueDate}
            onChange={(event) => onDueDateChange(event.target.value)}
            disabled={disabled}
            required={kind === 'invoice'}
            aria-invalid={errors?.dueDate || errors?.validUntil ? true : undefined}
          />
          {errors?.dueDate ? <FieldError>{errors.dueDate}</FieldError> : null}
          {errors?.validUntil ? <FieldError>{errors.validUntil}</FieldError> : null}
        </Field>
      </div>
    </FieldsetSurface>
  );
}
