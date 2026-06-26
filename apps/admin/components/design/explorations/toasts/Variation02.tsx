import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ToastBannerProps {}

export function ToastBanner(_props: ToastBannerProps = {}) {
  return (
    <div className="w-full" style={{ background: 'var(--background)' }}>
      <div
        className="flex items-center justify-between gap-4 border-b px-6 py-3"
        style={{
          background: 'color-mix(in srgb, var(--info, #3b82f6) 8%, var(--card) 92%)',
          borderColor: 'color-mix(in srgb, var(--info, #3b82f6) 22%, var(--border))',
        }}
      >
        <div className="flex items-center gap-3">
          <Info className="size-4" style={{ color: 'var(--info, #3b82f6)' }} />
          <div className="text-sm">
            <span className="font-medium">Maintenance window:</span>{' '}
            <span style={{ color: 'var(--muted-foreground)' }}>
              We&rsquo;ll pause webhooks for 5 minutes at 11:00 PT for a routine database upgrade.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            View status
          </Button>
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
            aria-label="Dismiss"
          >
            <X className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
      </div>

      <div
        className="px-6 py-12 text-center text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Page content area &mdash; banner sits above this
      </div>
    </div>
  );
}
