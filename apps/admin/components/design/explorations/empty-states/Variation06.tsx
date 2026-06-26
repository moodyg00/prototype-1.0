import { Lock, KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface EmptyStatePermissionLockedProps {}

export function EmptyStatePermissionLocked(_props: EmptyStatePermissionLockedProps = {}) {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative">
          <div
            className="grid size-14 place-items-center rounded-2xl border"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
              color: 'var(--muted-foreground)',
            }}
          >
            <Lock className="size-5.5" />
          </div>
          <div
            className="absolute -right-2 -top-1 grid size-6 place-items-center rounded-full border"
            style={{
              background: 'var(--primary)',
              borderColor: 'var(--card)',
              color: 'var(--primary-foreground, white)',
            }}
          >
            <KeyRound className="size-3" />
          </div>
        </div>
        <h3 className="mt-5 font-heading font-semibold text-xl">You don&apos;t have access</h3>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          The <span className="font-mono text-xs">finance.invoices.view</span> permission is
          required to see this section. Your workspace admin can grant it from team settings.
        </p>

        <div
          className="mt-5 flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
          style={{
            background: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <ShieldCheck className="size-3.5" />
          Signed in as <span className="font-mono">janet@vertex.io</span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button size="sm">Request access</Button>
          <Button variant="outline" size="sm">
            Switch account
          </Button>
        </div>
      </div>
    </div>
  );
}
