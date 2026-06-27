import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface ToastDestructiveInlineProps {}

export function ToastDestructiveInline(_props: ToastDestructiveInlineProps = {}) {
  return (
    <div
      className="grid place-items-center px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="flex w-full max-w-md items-start gap-3 rounded-xl border p-4 shadow-md"
        style={{
          background: 'color-mix(in srgb, var(--destructive, #dc2626) 4%, var(--card) 96%)',
          borderColor: 'color-mix(in srgb, var(--destructive, #dc2626) 28%, var(--border))',
        }}
      >
        <div
          className="grid size-9 shrink-0 place-items-center rounded-lg"
          style={{
            background: 'color-mix(in srgb, var(--destructive, #dc2626) 12%, transparent)',
            color: 'var(--destructive, #dc2626)',
          }}
        >
          <ShieldAlert className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="space-y-0.5">
            <div className="font-medium text-sm leading-tight">
              Stop running automation &ldquo;Daily AR sweep&rdquo;?
            </div>
            <div
              className="text-xs leading-snug"
              style={{ color: 'var(--muted-foreground)' }}
            >
              It&rsquo;s currently emailing 47 customers. Stopping now will skip the remaining 12
              recipients.
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="destructive"
              size="sm"
              className="h-7 px-2.5 text-xs"
            >
              Stop now
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
              Keep running
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
