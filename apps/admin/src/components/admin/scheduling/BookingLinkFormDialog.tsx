'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BOOKING_LINK_KINDS,
  FIELD_TYPES,
  type BookingLinkKind,
  type CollectField,
  type FieldType,
} from '@/src/lib/validation/scheduling';

const NONE = '__none__';

export interface BookingLinkDto {
  id: string;
  name: string;
  slug: string;
  linkKind: BookingLinkKind;
  isActive: boolean;
  serviceId: string | null;
  contactId: string | null;
  durationMinutes: number | null;
  channel: string | null;
  fieldsToCollect: CollectField[];
}

interface PickerItem {
  id: string;
  name: string;
}

interface FormState {
  name: string;
  linkKind: BookingLinkKind;
  isActive: boolean;
  serviceId: string;
  contactId: string;
  durationMinutes: string;
  channel: string;
  fields: CollectField[];
}

function initialState(link: BookingLinkDto | null): FormState {
  return {
    name: link?.name ?? '',
    linkKind: link?.linkKind ?? 'standard',
    isActive: link?.isActive ?? true,
    serviceId: link?.serviceId ?? NONE,
    contactId: link?.contactId ?? NONE,
    durationMinutes: link?.durationMinutes ? String(link.durationMinutes) : '',
    channel: link?.channel ?? '',
    fields: link?.fieldsToCollect ?? [
      { key: 'name', label: 'Full name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
    ],
  };
}

function slugifyKey(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';
}

export function BookingLinkFormDialog({
  open,
  onOpenChange,
  link,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: BookingLinkDto | null;
  onSaved: () => void;
}): React.ReactElement {
  const isEdit = Boolean(link);
  const [form, setForm] = React.useState<FormState>(() => initialState(link));
  const [submitting, setSubmitting] = React.useState(false);
  const [services, setServices] = React.useState<PickerItem[]>([]);
  const [contacts, setContacts] = React.useState<PickerItem[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setForm(initialState(link));
    void (async () => {
      try {
        const [s, c] = await Promise.all([
          fetch('/api/admin/offerings?scope=picker').then((r) => r.json()),
          fetch('/api/admin/contacts?scope=picker').then((r) => r.json()),
        ]);
        setServices((s.items ?? []).map((i: PickerItem) => ({ id: i.id, name: i.name })));
        setContacts((c.items ?? []).map((i: PickerItem) => ({ id: i.id, name: i.name })));
      } catch {
        /* selects just stay empty */
      }
    })();
  }, [open, link]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateField = (index: number, patch: Partial<CollectField>) =>
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length === 0) {
      toast.error('Name is required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        linkKind: form.linkKind,
        isActive: form.isActive,
        serviceId: form.serviceId === NONE ? undefined : form.serviceId,
        contactId: form.contactId === NONE ? undefined : form.contactId,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        channel: form.channel.trim() || undefined,
        fieldsToCollect: form.fields.map((f) => ({
          key: f.key || slugifyKey(f.label),
          label: f.label,
          type: f.type,
          required: f.required,
        })),
      };
      const res = await fetch(
        isEdit ? `/api/admin/booking-links/${link?.id}` : '/api/admin/booking-links',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json().catch(() => ({}))) as { link?: { name: string }; error?: string };
      if (!res.ok || !body.link) throw new Error(body.error ?? 'Could not save booking link.');
      toast.success(isEdit ? `Saved ${body.link.name}` : `Created ${body.link.name}`);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save booking link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit booking link' : 'New booking link'}</DialogTitle>
          <DialogDescription>
            Booking links collect bookings on a public page. Choose what to collect from the customer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogPanel className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="On-site consult"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Kind</FieldLabel>
                <Select value={form.linkKind} onValueChange={(v) => update('linkKind', v as BookingLinkKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {BOOKING_LINK_KINDS.map((k) => (
                      <SelectItem key={k} value={k} className="capitalize">
                        {k}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Service</FieldLabel>
                <Select value={form.serviceId} onValueChange={(v) => update('serviceId', v as string)}>
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => {
                        if (!value || value === NONE) return 'No service';
                        return services.find((s) => s.id === value)?.name ?? 'No service';
                      }}
                    </SelectValue>
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
                <FieldLabel>Contact</FieldLabel>
                <Select value={form.contactId} onValueChange={(v) => update('contactId', v as string)}>
                  <SelectTrigger>
                    <SelectValue>
                      {(value) => {
                        if (!value || value === NONE) return 'No contact';
                        return contacts.find((c) => c.id === value)?.name ?? 'No contact';
                      }}
                    </SelectValue>
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
                <FieldLabel>Duration (minutes)</FieldLabel>
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => update('durationMinutes', e.target.value)}
                  placeholder="45"
                />
              </Field>
              <Field>
                <FieldLabel>Channel</FieldLabel>
                <Input
                  value={form.channel}
                  onChange={(e) => update('channel', e.target.value)}
                  placeholder="on-site, phone, video"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Fields to collect</FieldLabel>
              <FieldDescription>What the customer fills in on the public booking page.</FieldDescription>
              <div className="mt-2 space-y-2">
                {form.fields.map((field, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <Input
                      className="flex-1 min-w-40"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value, key: slugifyKey(e.target.value) })}
                      placeholder="Field label"
                    />
                    <Select
                      value={field.type}
                      onValueChange={(v) => updateField(index, { type: v as FieldType })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectPopup>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="capitalize">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectPopup>
                    </Select>
                    <label className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(index, { required: checked === true })}
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }))
                      }
                      className="text-muted-foreground hover:text-destructive-foreground"
                      aria-label="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      fields: [...prev.fields, { key: '', label: '', type: 'text', required: false }],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add field
                </Button>
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.isActive} onCheckedChange={(c) => update('isActive', c === true)} />
              Active
            </label>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
