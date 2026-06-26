import { Suspense } from 'react';

import { LoginForm } from '@/src/components/auth/LoginForm';
import { Spinner } from '@/components/ui/spinner';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
