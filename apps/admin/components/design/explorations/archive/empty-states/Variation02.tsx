import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface EmptyStateIllustrationLedProps {}

export function EmptyStateIllustrationLed(_props: EmptyStateIllustrationLedProps = {}) {
  return (
    <div className="grid place-items-center px-6 py-16">
      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        <div className="relative mb-8 h-40 w-56">
          <div
            className="absolute left-2 top-6 size-20 rounded-2xl"
            style={{
              background: 'color-mix(in srgb, var(--primary-soft) 80%, transparent)',
              transform: 'rotate(-8deg)',
            }}
          />
          <div
            className="absolute right-4 top-10 size-16 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--primary) 18%, var(--card) 82%)',
            }}
          />
          <div
            className="absolute left-1/2 top-2 h-28 w-32 -translate-x-1/2 rounded-xl border shadow-sm"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="absolute inset-x-3 top-3 h-2 rounded-full"
              style={{ background: 'var(--muted)' }}
            />
            <div
              className="absolute left-3 top-7 h-2 w-16 rounded-full"
              style={{ background: 'var(--muted)' }}
            />
            <div
              className="absolute inset-x-3 bottom-3 h-6 rounded-md"
              style={{ background: 'var(--primary-soft)' }}
            />
          </div>
          <div
            className="absolute -bottom-2 left-1/2 h-3 w-32 -translate-x-1/2 rounded-full opacity-50 blur-sm"
            style={{ background: 'var(--muted-foreground)' }}
          />
        </div>
        <h3 className="font-heading font-semibold text-xl">No projects yet</h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Spin up your first project to group jobs, contracts, and invoices under a single deal.
          We&apos;ll keep all the moving parts in sync.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            Create a project
          </Button>
          <Button variant="outline" size="sm">
            See examples
          </Button>
        </div>
      </div>
    </div>
  );
}
