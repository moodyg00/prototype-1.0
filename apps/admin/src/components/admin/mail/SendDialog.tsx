'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type {
  MailAudience,
  MailContact,
  MailOrganization,
  MailTemplate,
  SendMode,
} from './types';

export interface SendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: MailTemplate | null;
}

const MODE_LABELS: Record<SendMode, string> = {
  contacts: 'Individual contacts',
  organization: 'An organization',
  audience: 'A saved audience',
};

export function SendDialog({ open, onOpenChange, template }: SendDialogProps): React.ReactElement | null {
  const [mode, setMode] = React.useState<SendMode>('contacts');

  const [contactQuery, setContactQuery] = React.useState('');
  const [contactResults, setContactResults] = React.useState<MailContact[]>([]);
  const [selectedContacts, setSelectedContacts] = React.useState<Map<string, MailContact>>(new Map());

  const [organizations, setOrganizations] = React.useState<MailOrganization[]>([]);
  const [organizationId, setOrganizationId] = React.useState('');

  const [audiences, setAudiences] = React.useState<MailAudience[]>([]);
  const [audienceId, setAudienceId] = React.useState('');

  const [saveAsAudience, setSaveAsAudience] = React.useState(false);
  const [audienceName, setAudienceName] = React.useState('');

  const [sending, setSending] = React.useState(false);

  // Reset all selection state each time the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    setMode('contacts');
    setContactQuery('');
    setSelectedContacts(new Map());
    setOrganizationId('');
    setAudienceId('');
    setSaveAsAudience(false);
    setAudienceName('');
  }, [open]);

  // Load organizations and saved audiences once the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    let active = true;
    void (async () => {
      try {
        const [orgRes, audRes] = await Promise.all([
          fetch('/api/admin/organizations', { cache: 'no-store' }),
          fetch('/api/admin/email-audiences', { cache: 'no-store' }),
        ]);
        const orgBody = (await orgRes.json().catch(() => ({}))) as { items?: MailOrganization[] };
        const audBody = (await audRes.json().catch(() => ({}))) as { audiences?: MailAudience[] };
        if (!active) return;
        setOrganizations(orgBody.items ?? []);
        setAudiences(audBody.audiences ?? []);
      } catch {
        /* selectors stay empty; surfaced on send if needed */
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  // Search contacts whenever the query changes while in contacts mode.
  React.useEffect(() => {
    if (!open || mode !== 'contacts') return;
    let active = true;
    const handle = setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({ scope: 'picker' });
          if (contactQuery.trim().length > 0) params.set('q', contactQuery.trim());
          const res = await fetch(`/api/admin/contacts?${params.toString()}`, { cache: 'no-store' });
          const body = (await res.json().catch(() => ({}))) as { items?: MailContact[] };
          if (active) setContactResults(body.items ?? []);
        } catch {
          if (active) setContactResults([]);
        }
      })();
    }, 200);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [open, mode, contactQuery]);

  if (!template) return null;

  const toggleContact = (contact: MailContact, checked: boolean) => {
    setSelectedContacts((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(contact.id, contact);
      } else {
        next.delete(contact.id);
      }
      return next;
    });
  };

  const recipientHint = (() => {
    if (mode === 'contacts') return `${selectedContacts.size} contact(s) selected`;
    if (mode === 'organization') {
      const org = organizations.find((item) => item.id === organizationId);
      return org ? `Targets all active contacts at ${org.name}` : 'Select an organization';
    }
    const audience = audiences.find((item) => item.id === audienceId);
    return audience ? `~${audience.estimatedRecipientCount} recipients` : 'Select a saved audience';
  })();

  const buildSelection = () => {
    if (mode === 'contacts') {
      const contactIds = Array.from(selectedContacts.keys());
      if (contactIds.length === 0) return null;
      return { type: 'contacts' as const, contactIds };
    }
    if (mode === 'organization') {
      if (!organizationId) return null;
      return { type: 'organization' as const, organizationId };
    }
    if (!audienceId) return null;
    return { type: 'audience' as const, audienceId };
  };

  const handleSend = async () => {
    const selection = buildSelection();
    if (!selection) {
      toast.error('Choose at least one recipient for this send.');
      return;
    }
    if (saveAsAudience && audienceName.trim().length === 0) {
      toast.error('Enter a name to save this selection as an audience.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          selection,
          ...(saveAsAudience ? { saveAsAudience: { name: audienceName.trim() } } : {}),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        recipientCount?: number;
        skippedNoEmail?: number;
        savedAudienceId?: string | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? 'Send failed.');
      }
      const skipped = body.skippedNoEmail ?? 0;
      const savedNote = body.savedAudienceId ? ' · audience saved' : '';
      toast.success(
        `Sent "${template.name}" to ${body.recipientCount ?? 0} recipient(s)` +
          (skipped > 0 ? ` (${skipped} skipped, no email)` : '') +
          savedNote,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Send failed.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send template</DialogTitle>
          <DialogDescription>
            Manual one-off send of <span className="font-medium text-foreground">{template.name}</span>. This is an
            override, not a scheduled campaign.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          <Field>
            <FieldLabel>Audience</FieldLabel>
            <Select value={mode} onValueChange={(value) => setMode(value as SendMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                {(Object.keys(MODE_LABELS) as SendMode[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {MODE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </Field>

          {mode === 'contacts' ? (
            <div className="space-y-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <Input
                  value={contactQuery}
                  onChange={(event) => setContactQuery(event.target.value)}
                  placeholder="Search contacts by name or email"
                  className="pl-10"
                  type="search"
                />
              </div>
              <div
                className="max-h-56 space-y-1 overflow-auto rounded-lg border p-1"
                style={{ borderColor: 'var(--border)' }}
              >
                {contactResults.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No contacts found.
                  </div>
                ) : (
                  contactResults.map((contact) => {
                    const checked = selectedContacts.has(contact.id);
                    return (
                      <label
                        key={contact.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-[var(--accent)]"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => toggleContact(contact, value === true)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{contact.name}</span>
                          <span className="block truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            {contact.email ?? 'No email on file'}
                            {contact.organizationName ? ` · ${contact.organizationName}` : ''}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}

          {mode === 'organization' ? (
            <Field>
              <FieldLabel>Organization</FieldLabel>
              <Select value={organizationId} onValueChange={(value) => setOrganizationId(value as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectPopup>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
          ) : null}

          {mode === 'audience' ? (
            <Field>
              <FieldLabel>Saved audience</FieldLabel>
              <Select value={audienceId} onValueChange={(value) => setAudienceId(value as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved audience" />
                </SelectTrigger>
                <SelectPopup>
                  {audiences.length === 0 ? (
                    <SelectItem value="" disabled>
                      No saved audiences yet
                    </SelectItem>
                  ) : (
                    audiences.map((audience) => (
                      <SelectItem key={audience.id} value={audience.id}>
                        {audience.name} (~{audience.estimatedRecipientCount})
                      </SelectItem>
                    ))
                  )}
                </SelectPopup>
              </Select>
            </Field>
          ) : null}

          <div
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
          >
            <span>{recipientHint}</span>
            <Badge variant="outline">override</Badge>
          </div>

          {mode !== 'audience' ? (
            <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  checked={saveAsAudience}
                  onCheckedChange={(value) => setSaveAsAudience(value === true)}
                />
                <span>Save this selection as a new audience</span>
              </label>
              {saveAsAudience ? (
                <Input
                  value={audienceName}
                  onChange={(event) => setAudienceName(event.target.value)}
                  placeholder="Audience name"
                />
              ) : null}
            </div>
          ) : null}
        </DialogPanel>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>Cancel</DialogClose>
          <Button type="button" loading={sending} onClick={handleSend}>
            Send now
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
