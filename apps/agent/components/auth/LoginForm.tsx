'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';

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
      router.replace(nextPath.startsWith('/') ? nextPath : '/');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-xl">
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">Agent sign in</h1>
          <p className="text-sm text-zinc-400">Same account as admin. Session shared in production.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-300">Email or username</span>
          <input
            className="w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/30"
            autoComplete="username"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm text-zinc-300">Password</span>
          <input
            className="w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-white/30"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button
          className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-zinc-950 disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
