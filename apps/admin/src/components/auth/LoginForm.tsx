'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/admin';

  const [login, setLogin] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to sign in.');
      }
      toast.success('Signed in.');
      router.replace(nextPath.startsWith('/') ? nextPath : '/admin');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-muted-foreground text-sm">Use your email or username and password.</p>
        </div>

        <Field>
          <FieldLabel htmlFor="login">Email or username</FieldLabel>
          <Input
            id="login"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <FieldDescription>Session is shared with App Lab on the same domain in production.</FieldDescription>
        </Field>

        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? (
            <>
              <Spinner className="mr-2" />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </Card>
  );
}
