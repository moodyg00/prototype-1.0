import type { ReactNode } from 'react';

/** Public booking pages — no admin sidebar. */
export default function BookLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">{children}</main>
    </div>
  );
}
