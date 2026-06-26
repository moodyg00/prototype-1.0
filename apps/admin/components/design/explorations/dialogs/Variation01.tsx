import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface DialogClassicCenteredProps {}

export function DialogClassicCentered(_props: DialogClassicCenteredProps = {}) {
  return (
    <div
      className="relative grid place-items-center px-6 py-10"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 14%, var(--background))',
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border shadow-xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg tracking-tight">Save changes?</h3>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              You&rsquo;ve made changes to this client record. Save them before navigating away.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
            aria-label="Close"
          >
            <X className="size-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div className="px-6 pb-5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Unsaved fields: <span style={{ color: 'var(--foreground)' }}>contact name</span>,{' '}
          <span style={{ color: 'var(--foreground)' }}>billing email</span>,{' '}
          <span style={{ color: 'var(--foreground)' }}>primary phone</span>.
        </div>

        <div
          className="flex items-center justify-end gap-2 border-t px-6 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <Button variant="outline" size="sm">
            Discard
          </Button>
          <Button size="sm">Save changes</Button>
        </div>
      </div>
    </div>
  );
}
