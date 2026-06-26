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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type CredentialDto = {
  id: string;
  name: string;
  siteUrl: string | null;
  username: string;
  password: string;
  notes: string | null;
  isActive: boolean;
};

interface FormState {
  name: string;
  siteUrl: string;
  username: string;
  password: string;
  notes: string;
  isActive: boolean;
}

function initialState(credential: CredentialDto | null): FormState {
  return {
    name: credential?.name ?? '',
    siteUrl: credential?.siteUrl ?? '',
    username: credential?.username ?? '',
    password: credential?.password ?? '',
    notes: credential?.notes ?? '',
    isActive: credential?.isActive ?? true,
  };
}

export function CredentialFormDialog({
  open,
  onOpenChange,
  credential,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  credential: CredentialDto | null;
  onSaved: () => void;
}): React.ReactElement {
  const isEdit = Boolean(credential);
  const [form, setForm] = React.useState<FormState>(() => initialState(credential));
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setForm(initialState(credential));
  }, [open, credential]);

  React.useEffect(() => {
    if (!open || !isEdit || !credential) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/credentials/${credential.id}`);
        const body = (await res.json()) as { credential?: CredentialDto };
        if (body.credential) setForm(initialState(body.credential));
      } catch {
        /* keep list payload */
      }
    })();
  }, [open, isEdit, credential]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length === 0) {
      toast.error('Name is required.');
      return;
    }
    if (form.username.trim().length === 0) {
      toast.error('Username or email is required.');
      return;
    }
    if (!isEdit && form.password.trim().length === 0) {
      toast.error('Password is required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        siteUrl: form.siteUrl.trim() || undefined,
        username: form.username.trim(),
        password: form.password.trim() || undefined,
        notes: form.notes.trim() || undefined,
        isActive: form.isActive,
      };
      const res = await fetch(
        isEdit ? `/api/admin/credentials/${credential?.id}` : '/api/admin/credentials',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        credential?: { name: string };
        error?: string;
      };
      if (!res.ok || !body.credential) {
        throw new Error(body.error ?? 'Could not save credential.');
      }
      toast.success(isEdit ? `Saved ${body.credential.name}` : `Created ${body.credential.name}`);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save credential.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit login' : 'New login'}</DialogTitle>
          <DialogDescription>
            Save website credentials — usernames, emails, and passwords for dashboards and vendor portals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogPanel className="space-y-4">
            <Field>
              <FieldLabel>Label</FieldLabel>
              <Input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Mercury dashboard"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Site URL</FieldLabel>
              <Input
                value={form.siteUrl}
                onChange={(e) => update('siteUrl', e.target.value)}
                placeholder="https://app.mercury.com"
              />
            </Field>
            <Field>
              <FieldLabel>Username or email</FieldLabel>
              <Input
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="username"
              />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current password' : '••••••••'}
                required={!isEdit}
                autoComplete="new-password"
              />
              {isEdit ? (
                <FieldDescription>Leave blank to keep the stored password.</FieldDescription>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <Textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="2FA via authenticator app on phone."
                rows={3}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(checked) => update('isActive', checked === true)}
              />
              Active
            </label>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create login'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
