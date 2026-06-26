'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CollectField, ProposedSlot } from '@/src/lib/validation/scheduling';

export function PublicBookingForm({
  token,
  linkKind,
  fields,
  proposedSlots,
  knownData,
}: {
  token: string;
  linkKind: string;
  fields: CollectField[];
  proposedSlots: ProposedSlot[];
  knownData: Record<string, unknown>;
}): React.ReactElement {
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      const known = knownData[field.key];
      if (known != null) initial[field.key] = String(known);
    }
    return initial;
  });
  const [slotIndex, setSlotIndex] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const slot = proposedSlots[slotIndex];
    if (!slot && linkKind === 'confirmation') {
      toast.error('Choose a time.');
      return;
    }
    const startsAt = slot?.startsAt ?? new Date().toISOString();
    const endsAt =
      slot?.endsAt ??
      new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();

    setSubmitting(true);
    try {
      const res = await fetch(`/api/book/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectedData: values, startsAt, endsAt }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        workOrderNote?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? 'Could not submit booking.');
      setDone(true);
      toast.success(body.workOrderNote ?? 'Booking confirmed. Thank you!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-8 rounded-xl border p-6 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-lg font-semibold">You&apos;re all set</p>
        <p className="mt-2 text-sm text-muted-foreground">Your booking is confirmed. We&apos;ll be in touch.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
      {proposedSlots.length > 0 && (
        <Field>
          <FieldLabel>{linkKind === 'confirmation' ? 'Confirm a time' : 'Choose a time'}</FieldLabel>
          <div className="space-y-2">
            {proposedSlots.map((slot, index) => (
              <label
                key={slot.startsAt}
                className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: slotIndex === index ? 'var(--foreground)' : 'var(--border)',
                }}
              >
                <input
                  type="radio"
                  name="slot"
                  checked={slotIndex === index}
                  onChange={() => setSlotIndex(index)}
                />
                {new Date(slot.startsAt).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </label>
            ))}
          </div>
        </Field>
      )}

      {fields.map((field) => (
        <Field key={field.key}>
          <FieldLabel>
            {field.label}
            {field.required ? '' : ' (optional)'}
          </FieldLabel>
          {field.type === 'textarea' ? (
            <Textarea
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              required={field.required}
            />
          ) : (
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
              value={values[field.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              required={field.required}
            />
          )}
        </Field>
      ))}

      <Button type="submit" className="w-full" loading={submitting}>
        {linkKind === 'confirmation' ? 'Confirm booking' : 'Submit booking'}
      </Button>
    </form>
  );
}
