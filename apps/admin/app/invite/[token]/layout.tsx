import type { ReactNode } from 'react';

/** Public invite acceptance — no admin sidebar. */
export default function InviteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <main className="mx-auto max-w-md px-4 py-10 sm:py-14">{children}</main>
    </div>
  );
}
