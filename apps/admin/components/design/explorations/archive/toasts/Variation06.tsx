import { Undo2, X, Trash2 } from 'lucide-react';

// @mock-start
// @mock-end

export interface ToastProgressUndoProps {}

export function ToastProgressUndo(_props: ToastProgressUndoProps = {}) {
  return (
    <div
      className="grid place-items-center px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-lg border shadow-lg"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-3 p-3.5">
          <div
            className="grid size-8 shrink-0 place-items-center rounded-md"
            style={{
              background: 'color-mix(in srgb, var(--destructive, #dc2626) 12%, transparent)',
              color: 'var(--destructive, #dc2626)',
            }}
          >
            <Trash2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="font-medium text-sm leading-tight">3 work orders archived</div>
            <div
              className="text-xs leading-snug"
              style={{ color: 'var(--muted-foreground)' }}
            >
              They&rsquo;ll be deleted permanently in 5 seconds.
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md px-2 py-1 font-medium text-xs transition-colors hover:bg-[var(--muted)]"
            style={{ color: 'var(--primary)' }}
          >
            <Undo2 className="size-3" />
            Undo
          </button>
          <button
            type="button"
            className="rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
            aria-label="Dismiss"
          >
            <X className="size-3" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>

        <div
          className="h-1 w-full"
          style={{ background: 'var(--muted)' }}
        >
          <div
            className="h-full"
            style={{
              width: '38%',
              background: 'var(--primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
