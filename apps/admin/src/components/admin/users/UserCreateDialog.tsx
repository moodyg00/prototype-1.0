'use client';

import * as React from 'react';
import { Copy, UserPlus } from 'lucide-react';
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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AUTOMATION_USER_TYPES } from '@/src/lib/validation/users';

const NO_ROLE = '__none__';

type UserRoleOption = { id: string; name: string };

type InviteResult = {
  inviteUrl: string;
  emailSent: boolean;
  emailDetail: string;
};

type AutomationResult = {
  apiKey: string;
};

async function copyText(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error(`Unable to copy ${label.toLowerCase()}.`);
  }
}

export function UserCreateDialog({
  open,
  onOpenChange,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: UserRoleOption[];
  onSaved: () => void;
}) {
  const [mode, setMode] = React.useState<'human' | 'automation'>('human');
  const [email, setEmail] = React.useState('');
  const [roleId, setRoleId] = React.useState('');
  const [sendEmail, setSendEmail] = React.useState(true);
  const [fullName, setFullName] = React.useState('');
  const [userType, setUserType] = React.useState<(typeof AUTOMATION_USER_TYPES)[number]>('automation');
  const [description, setDescription] = React.useState('');
  const [automationRoleId, setAutomationRoleId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [inviteResult, setInviteResult] = React.useState<InviteResult | null>(null);
  const [automationResult, setAutomationResult] = React.useState<AutomationResult | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setMode('human');
    setEmail('');
    setRoleId(roles[0]?.id ?? '');
    setSendEmail(true);
    setFullName('');
    setUserType('automation');
    setDescription('');
    setAutomationRoleId(NO_ROLE);
    setInviteResult(null);
    setAutomationResult(null);
  }, [open, roles]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'human') {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'invite',
            email,
            roleId,
            sendEmail,
          }),
        });
        const payload = (await response.json()) as InviteResult & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Unable to send invite.');
        setInviteResult({
          inviteUrl: payload.inviteUrl,
          emailSent: payload.emailSent,
          emailDetail: payload.emailDetail,
        });
        if (payload.emailSent) {
          toast.success('Invite email sent.');
        } else {
          toast.message('Invite created. Copy the link below — email was not delivered.');
        }
      } else {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            fullName,
            userType,
            roleId: automationRoleId && automationRoleId !== NO_ROLE ? automationRoleId : undefined,
            description: description.trim() || undefined,
          }),
        });
        const payload = (await response.json()) as AutomationResult & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Unable to create automation user.');
        setAutomationResult({ apiKey: payload.apiKey });
        toast.success('Automation user created. Copy the API key now — it will not be shown again.');
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'human' ? 'Invite user' : 'Create automation user'}</DialogTitle>
          <DialogDescription>
            {mode === 'human'
              ? 'Send an invite link so the user can choose a username and password.'
              : 'Generate a server-to-server API key for an agent or automation account.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void submit(event)}>
          <DialogPanel className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'human' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setMode('human')}
              >
                <UserPlus className="size-4" />
                Human invite
              </Button>
              <Button
                type="button"
                variant={mode === 'automation' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setMode('automation')}
              >
                Automation / agent
              </Button>
            </div>

            {mode === 'human' ? (
              <>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select value={roleId} onValueChange={(value) => setRoleId(value as string)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role">
                        {(value) => roles.find((role) => role.id === value)?.name ?? 'Select role'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectPopup>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(event) => setSendEmail(event.target.checked)}
                  />
                  Send invite email when provider is configured
                </label>
                {inviteResult ? (
                  <Field>
                    <FieldLabel>Invite link</FieldLabel>
                    <div className="flex gap-2">
                      <Input value={inviteResult.inviteUrl} readOnly className="font-mono text-xs" />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void copyText(inviteResult.inviteUrl, 'Invite link')}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <FieldDescription>
                      {inviteResult.emailSent
                        ? inviteResult.emailDetail
                        : 'Email was not delivered. Share this link manually for development.'}
                    </FieldDescription>
                  </Field>
                ) : null}
              </>
            ) : (
              <>
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="e.g. Mercury sync bot"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Type</FieldLabel>
                  <Select value={userType} onValueChange={(value) => setUserType(value as typeof userType)}>
                    <SelectTrigger>
                      <SelectValue>
                        {(value) => (value === 'ai_agent' ? 'AI agent' : 'Automation')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value="automation">Automation</SelectItem>
                      <SelectItem value="ai_agent">AI agent</SelectItem>
                    </SelectPopup>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    value={automationRoleId || NO_ROLE}
                    onValueChange={(value) => setAutomationRoleId(value as string)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional">
                        {(value) =>
                          value && value !== NO_ROLE
                            ? (roles.find((role) => role.id === value)?.name ?? 'Optional')
                            : 'No role'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectPopup>
                      <SelectItem value={NO_ROLE}>No role</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional notes about what this account is for"
                    rows={3}
                  />
                </Field>
                <FieldDescription>
                  API keys are for server-to-server use only. The full key is shown once at creation and masked in lists.
                </FieldDescription>
                {automationResult ? (
                  <Field>
                    <FieldLabel>API key</FieldLabel>
                    <div className="flex gap-2">
                      <Input value={automationResult.apiKey} readOnly className="font-mono text-xs" />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void copyText(automationResult.apiKey, 'API key')}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </Field>
                ) : null}
              </>
            )}
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Close</DialogClose>
            {!inviteResult && !automationResult ? (
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : mode === 'human' ? 'Send invite' : 'Create user'}
              </Button>
            ) : null}
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  );
}
