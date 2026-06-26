'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const NONE = '__none__';

interface PickerItem {
  id: string;
  name: string;
}

export interface SlotSelection {
  start: Date;
  end: Date;
}

export function CreateBookingFromSlotDialog({
  open,
  onOpenChange,
  slot,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: SlotSelection | null;
  onCreated: (result: { bookingUrl?: string | null }) => void;
}): React.ReactElement {
  const [contactId, setContactId] = React.useState(NONE);
  const [serviceId, setServiceId] = React.useState(NONE);
  const [notes, setNotes] = React.useState('');
  const [sendLink, setSendLink] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [contacts, setContacts] = React.useState<PickerItem[]>([]);
  const [services, setServices] = React.useState<PickerItem[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setContactId(NONE);
    setServiceId(NONE);
    setNotes('');
    setSendLink(false);
    void (async () => {
      try {
        const [c, s] = await Promise.all([
          fetch('/api/admin/contacts?scope=picker').then((r) => r.json()),
          fetch('/api/admin/offerings?scope=picker').then((r) => r.json()),
        ]);
        setContacts((c.items ?? []).map((i: PickerItem) => ({ id: i.id, name: i.name })));
        setServices((s.items ?? []).map((i: PickerItem) => ({ id: i.id, name: i.name })));
      } catch {
        /* selects stay empty */
      }
    })();
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!slot) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/calendar/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: contactId === NONE ? undefined : contactId,
          serviceId: serviceId === NONE ? undefined : serviceId,
          startsAt: slot.start.toISOString(),
          endsAt: slot.end.toISOString(),
          notes: notes.trim() || undefined,
          sendConfirmationLink: sendLink,
          status: sendLink ? 'pending_customer' : 'confirmed',
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        booking?: { id: string };
        bookingUrl?: string | null;
        error?: string;
      };
      if (!res.ok || !body.booking) throw new Error(body.error ?? 'Could not create booking.');
      toast.success(sendLink ? 'Booking created with confirmation link.' : 'Booking created.');
      onCreated({ bookingUrl: body.bookingUrl ?? null });
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const rangeLabel = slot
    ? `${slot.start.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} – ${slot.end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>{rangeLabel}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <DialogPanel className="space-y-4">
            <Field>
              <FieldLabel>Contact</FieldLabel>
              <Select value={contactId} onValueChange={(v) => setContactId(v as string)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value={NONE}>No contact</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Service</FieldLabel>
              <Select value={serviceId} onValueChange={(v) => setServiceId(v as string)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value={NONE}>No service</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to note…" />
            </Field>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox checked={sendLink} onCheckedChange={(c) => setSendLink(c === true)} className="mt-0.5" />
              <span>
                Send confirmation link
                <span className="block text-xs text-muted-foreground">
                  Creates a pending booking and a confirmation link with this slot for the customer to confirm.
                </span>
              </span>
            </label>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" loading={submitting}>
              Create booking
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
