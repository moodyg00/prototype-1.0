'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContactPickerField } from '@/src/components/admin/ContactPickerField';
import { RecordPanel, RecordView } from '@/src/components/admin/RecordView';
import { type AdminCreateDefinition, type AdminCreateField, type AdminCreateFieldGroup } from '@/src/lib/admin-record-form-config';
import { cn } from '@/src/lib/utils';

type FieldValue = string | boolean;

function getDefaultValue(field: AdminCreateField): FieldValue {
  if (typeof field.defaultValue === 'boolean') {
    return field.defaultValue;
  }

  if (typeof field.defaultValue === 'string') {
    return field.defaultValue;
  }

  if (field.type === 'checkbox') {
    return false;
  }

  return '';
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: AdminCreateField;
  value: FieldValue;
  onChange: (nextValue: FieldValue) => void;
}) {
  const label = (
    <div className="space-y-1.5">
      <div className="text-sm font-medium">{field.label}</div>
      {field.helperText ? <div className="text-xs text-[var(--muted-foreground)]">{field.helperText}</div> : null}
    </div>
  );

  if (field.type === 'textarea') {
    return (
      <label className="space-y-2">
        {label}
        <Textarea placeholder={field.placeholder} rows={4} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="space-y-2">
        {label}
        <select
          className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Select an option</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'date') {
    return (
      <label className="space-y-2">
        {label}
        <Input type="date" value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />
      </label>
    );
  }

  if (field.type === 'number') {
    return (
      <label className="space-y-2">
        {label}
        <Input
          type="number"
          step="any"
          placeholder={field.placeholder}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: 'var(--border)' }}>
        <input checked={typeof value === 'boolean' ? value : false} onChange={(event) => onChange(event.target.checked)} type="checkbox" className="size-4 rounded border" />
        <div className="space-y-1">
          <div className="text-sm font-medium">{field.label}</div>
          {field.helperText ? <div className="text-xs text-[var(--muted-foreground)]">{field.helperText}</div> : null}
        </div>
      </label>
    );
  }

  if (field.type === 'contact-picker') {
    return (
      <ContactPickerField
        label={field.label}
        helperText={field.helperText}
        placeholder={field.placeholder}
        value={typeof value === 'string' ? value : ''}
        onChange={(nextValue) => onChange(nextValue)}
      />
    );
  }

  return (
    <label className="space-y-2">
      {label}
      <Input placeholder={field.placeholder} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function FieldGroup({
  group,
  values,
  setValues,
}: {
  group: AdminCreateFieldGroup;
  values: Record<string, FieldValue>;
  setValues: React.Dispatch<React.SetStateAction<Record<string, FieldValue>>>;
}) {
  return (
    <fieldset className="border-t border-border/40 pt-5 first:border-t-0 first:pt-0">
      <legend className="px-2 text-sm font-semibold tracking-tight">{group.title}</legend>
      {group.description ? <div className="mb-4 text-sm text-[var(--muted-foreground)]">{group.description}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {group.fields.map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name] ?? getDefaultValue(field)}
            onChange={(nextValue) =>
              setValues((prev) => ({
                ...prev,
                [field.name]: nextValue,
              }))
            }
          />
        ))}
      </div>
    </fieldset>
  );
}

export function RecordCreatePage({
  section,
  backHref,
  definition,
}: {
  section: string;
  backHref: string;
  definition: AdminCreateDefinition;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [values, setValues] = React.useState<Record<string, FieldValue>>(() => {
    const initialValues: Record<string, FieldValue> = {};
    definition.groups.forEach((group) => {
      group.fields.forEach((field) => {
        initialValues[field.name] = getDefaultValue(field);
      });
    });
    return initialValues;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/${section}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      });

      const payload = (await response.json()) as { recordId?: string; recordTitle?: string; error?: string };

      if (!response.ok || !payload.recordId) {
        throw new Error(payload.error ?? 'Unable to create record.');
      }

      toast.success(`Created ${payload.recordTitle ?? definition.title.toLowerCase()}`);
      router.push(`/admin/${section}/${payload.recordId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create record.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <RecordView title={definition.title} subtitle={definition.description} backHref={backHref} backLabel="Back to records">
      <RecordPanel title={definition.title} description={definition.description}>
        <form className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          {definition.groups.map((group) => (
            <FieldGroup key={group.title} group={group} setValues={setValues} values={values} />
          ))}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <Link className={cn(buttonVariants({ variant: 'secondary' }))} href={backHref}>
              Cancel
            </Link>
            <Button loading={isSaving} type="submit">
              {definition.submitLabel}
            </Button>
          </div>
        </form>
      </RecordPanel>
    </RecordView>
  );
}
