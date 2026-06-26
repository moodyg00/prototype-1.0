'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

type InviteInfo = {
  email: string;
  roleName: string | null;
  expiresAt: string;
};

export function AcceptInviteForm({ token }: { token: string }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [invite, setInvite] = React.useState<InviteInfo | null>(null);
  const [username, setUsername] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/auth/invite/${token}`, { cache: 'no-store' });
        const payload = (await response.json()) as { invite?: InviteInfo; error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Invite link is invalid or expired.');
        setInvite(payload.invite ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invite link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/auth/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          fullName: fullName.trim() || undefined,
          password,
          confirmPassword,
        }),
      });
      const payload = (await response.json()) as { error?: string; details?: unknown };
      if (!response.ok) {
        const detail =
          payload.details &&
          typeof payload.details === 'object' &&
          payload.details !== null &&
          'fieldErrors' in payload.details
            ? Object.values(payload.details.fieldErrors as Record<string, string[]>)
                .flat()
                .join(' ')
            : null;
        throw new Error(detail || payload.error || 'Unable to accept invite.');
      }
      setCompleted(true);
      toast.success('Account created. Redirecting…');
      window.location.href = '/admin';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to accept invite.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Checking invite...
        </div>
      </Card>
    );
  }

  if (error || !invite) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-lg font-semibold">Invite unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error ?? 'This invite link is no longer valid.'}</p>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-lg font-semibold">Account ready</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account for <span className="font-medium text-foreground">{invite.email}</span> is set up.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Accept invite</h1>
        <p className="text-sm text-muted-foreground">
          Set up your account for <span className="font-medium text-foreground">{invite.email}</span>
          {invite.roleName ? ` as ${invite.roleName}` : ''}.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
          <FieldDescription>Letters, numbers, dots, underscores, and hyphens only.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Full name</FieldLabel>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            placeholder="Optional"
          />
        </Field>

        <Field>
          <FieldLabel>Password</FieldLabel>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Field>
          <FieldLabel>Confirm password</FieldLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </Field>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Card>
  );
}
