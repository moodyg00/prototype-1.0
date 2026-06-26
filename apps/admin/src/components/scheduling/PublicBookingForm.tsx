'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { BookingLinkKind, CollectField, ProposedSlot } from '@/src/lib/validation/scheduling';

interface LinkMeta {
  name: string;
  linkKind: BookingLinkKind;
  serviceName: string | null;
  knownData: Record<string, unknown>;
  fieldsToCollect: CollectField[];
  proposedSlots: ProposedSlot[];
}

export function PublicBookingForm({
  token,
  meta,
}: {
  token: string;
  meta: LinkMeta;
}): React.ReactElement {
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [selectedSlot, setSelectedSlot] = React.useState(0);
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of meta.fieldsToCollect) {
      const known = meta.knownData[field.key];
      if (known != null) initial[field.key] = String(known);
    }
    return initial;
  });

  React.useEffect(() => {
    if (meta.proposedSlots.length > 0) {
      const slot = meta.proposedSlots[0];
      setStartsAt(slot.startsAt.slice(0, 16));
      setEndsAt(slot.endsAt.slice(0, 16));
    }
  }, [meta.proposedSlots]);

  const pickSlot = (index: number) => {
    setSelectedSlot(index);
    const slot = meta.proposedSlots[index];
    if (slot) {
      setStartsAt(new Date(slot.startsAt).toISOString().slice(0, 16));
      setEndsAt(new Date(slot.endsAt).toISOString().slice(0, 16));
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      let startIso = startsAt;
      let endIso = endsAt;
      if (meta.proposedSlots.length > 0) {
        const slot = meta.proposedSlots[selectedSlot] ?? meta.proposedSlots[0];
        startIso = slot.startsAt;
        endIso = slot.endsAt;
      } else {
        startIso = new Date(startsAt).toISOString();
        endIso = new Date(endsAt).toISOString();
      }

      const collected: Record<string, unknown> = { ...meta.knownData };
      for (const field of meta.fieldsToCollect) {
        collected[field.key] = values[field.key] ?? '';
      }

      const res = await fetch(`/api/book/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectedData: collected, startsAt: startIso, endsAt: endIso }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        workOrderNote?: string;
        error?: string;
        details?: { fields?: string[] };
      };
      if (!res.ok) {
        const fieldList = body.details?.fields?.join(' ') ?? '';
        throw new Error([body.error, fieldList].filter(Boolean).join(' ') || 'Could not confirm booking.');
      }
      setDone(true);
      toast.success('Booking confirmed!');
      if (body.workOrderNote) toast.message(body.workOrderNote);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center dark:bg-emerald-950/30">
        <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">You&apos;re booked!</p>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">
          Thanks — we&apos;ve received your confirmation.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-6 rounded-xl border p-6" style={{ borderColor: 'var(--border)' }}>
      {meta.proposedSlots.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">
            {meta.linkKind === 'confirmation' ? 'Confirm a time' : 'Choose a time'}
          </legend>
          {meta.proposedSlots.map((slot, index) => (
            <label
              key={`${slot.startsAt}-${index}`}
              className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 has-[:checked]:border-foreground"
              style={{ borderColor: 'var(--border)' }}
            >
              <input
                type="radio"
                name="slot"
                checked={selectedSlot === index}
                onChange={() => pickSlot(index)}
                className="size-4"
              />
              <span className="text-sm font-medium">
                {new Date(slot.startsAt).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {meta.proposedSlots.length === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Start</FieldLabel>
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel>End</FieldLabel>
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required
            />
          </Field>
        </div>
      )}

      {meta.fieldsToCollect.map((field) => (
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

      <Button type="submit" size="lg" loading={submitting} className="w-full sm:w-auto">
        {meta.linkKind === 'confirmation' ? 'Confirm booking' : 'Book appointment'}
      </Button>
    </form>
  );
}
