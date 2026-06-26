'use client';

import * as React from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

type RecordFieldProps = {
  label: string;
  value: string;
  onCommit?: (nextValue: string) => Promise<void> | void;
  readOnly?: boolean;
  placeholder?: string;
};

export function RecordField({
  label,
  value,
  onCommit,
  readOnly = false,
  placeholder,
}: RecordFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  const canEdit = !readOnly && Boolean(onCommit);

  async function save() {
    if (!onCommit) return;
    const nextValue = draft.trim();
    const currentValue = value.trim();

    if (nextValue === currentValue) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      await onCommit(nextValue);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function enterEdit() {
    if (!canEdit) return;
    setDraft(value);
    setIsEditing(true);
  }

  return (
    <Field className="w-full gap-2 rounded-lg bg-card px-3 py-2.5">
      <div className="flex w-full min-w-0 items-center gap-3">
        <FieldLabel className="min-w-36 shrink-0 text-sm text-foreground sm:min-w-40">
          {label}:
        </FieldLabel>

        {isEditing ? (
          <InputGroup className="w-full min-w-0 flex-1">
            <InputGroupInput
              autoFocus
              aria-label={label}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void save();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setDraft(value);
                  setIsEditing(false);
                }
              }}
              placeholder={placeholder}
              size="sm"
              value={draft}
            />
            <InputGroupAddon align="inline-end">
              <Button
                aria-label={`Save ${label}`}
                loading={isSaving}
                onClick={() => void save()}
                size="icon-xs"
                variant="ghost"
              >
                <Check className="size-3.5" />
              </Button>
            </InputGroupAddon>
          </InputGroup>
        ) : (
          <Input
            aria-readonly="true"
            className="w-full min-w-0 flex-1"
            onClick={enterEdit}
            readOnly
            size="sm"
            type="text"
            value={value || '—'}
          />
        )}
      </div>
    </Field>
  );
}
