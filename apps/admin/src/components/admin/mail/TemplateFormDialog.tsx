'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import {
  humanize,
  TEMPLATE_CATEGORIES,
  TEMPLATE_STATUSES,
  type MailTemplate,
} from './types';

type FormState = {
  name: string;
  subject: string;
  category: string;
  status: string;
  preheader: string;
  bodyHtml: string;
  bodyText: string;
};

function initialFormState(template: MailTemplate | null): FormState {
  return {
    name: template?.name ?? '',
    subject: template?.subject ?? '',
    category: template?.category ?? 'promotional',
    status: template?.status ?? 'draft',
    preheader: template?.preheader ?? '',
    bodyHtml: template?.bodyHtml ?? '',
    bodyText: template?.bodyText ?? '',
  };
}

export interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this template; otherwise it creates a new one. */
  template: MailTemplate | null;
  onSaved: (template: MailTemplate) => void;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  template,
  onSaved,
}: TemplateFormDialogProps): React.ReactElement {
  const isEdit = Boolean(template);
  const [form, setForm] = React.useState<FormState>(() => initialFormState(template));
  const [submitting, setSubmitting] = React.useState(false);

  // Reset the form whenever the dialog opens for a (possibly different) record.
  React.useEffect(() => {
    if (open) {
      setForm(initialFormState(template));
    }
  }, [open, template]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length === 0 || form.subject.trim().length === 0) {
      toast.error('Name and subject are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        category: form.category,
        status: form.status,
        preheader: form.preheader,
        bodyHtml: form.bodyHtml,
        bodyText: form.bodyText,
      };
      const response = await fetch(
        isEdit ? `/api/admin/email-templates/${template?.id}` : '/api/admin/email-templates',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        template?: MailTemplate;
        error?: string;
      };
      if (!response.ok || !body.template) {
        throw new Error(body.error ?? 'Could not save template.');
      }
      toast.success(isEdit ? `Saved ${body.template.name}` : `Created ${body.template.name}`);
      onSaved(body.template);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save template.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit template' : 'New template'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the content and metadata for this email template.'
              : 'Create a reusable email template. You can send it manually from the browser.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogPanel className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="Spring promo blast"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Subject</FieldLabel>
                <Input
                  value={form.subject}
                  onChange={(event) => update('subject', event.target.value)}
                  placeholder="Save 20% this spring"
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Category</FieldLabel>
                <Select value={form.category} onValueChange={(value) => update('category', value as string)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {humanize(category)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={form.status} onValueChange={(value) => update('status', value as string)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup>
                    {TEMPLATE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {humanize(status)}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Preheader</FieldLabel>
              <Input
                value={form.preheader}
                onChange={(event) => update('preheader', event.target.value)}
                placeholder="Preview text shown in the inbox"
              />
              <FieldDescription>Optional preview snippet shown after the subject in most inboxes.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>HTML body</FieldLabel>
              <Textarea
                value={form.bodyHtml}
                onChange={(event) => update('bodyHtml', event.target.value)}
                placeholder="<h1>Hello…</h1>"
                className="min-h-32 font-mono text-xs"
              />
              <FieldDescription>Rendered in the preview. Leave blank to use the plain-text body.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Plain-text body</FieldLabel>
              <Textarea
                value={form.bodyText}
                onChange={(event) => update('bodyText', event.target.value)}
                placeholder="Hello…"
                className="min-h-24"
              />
            </Field>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Save changes' : 'Create template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
