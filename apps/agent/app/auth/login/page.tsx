import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={<p className="text-sm text-zinc-400">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
