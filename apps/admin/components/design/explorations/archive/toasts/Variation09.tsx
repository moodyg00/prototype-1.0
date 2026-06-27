import { Loader2, CheckCircle2 } from 'lucide-react';

// @mock-start
// @mock-end

export interface ToastPromiseProps {}

export function ToastPromise(_props: ToastPromiseProps = {}) {
  return (
    <div
      className="flex flex-col items-center gap-3 px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="flex w-full max-w-md items-start gap-3 rounded-lg border p-3.5 shadow-md"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <Loader2
          className="size-4 shrink-0 animate-spin"
          style={{ color: 'var(--primary)', marginTop: 2 }}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="font-medium text-sm leading-tight">Generating quote...</div>
          <div
            className="text-xs leading-snug"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Compiling line items and pricing tiers from the contract template.
          </div>
        </div>
      </div>

      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted-foreground)' }}>
        becomes
      </div>

      <div
        className="flex w-full max-w-md items-start gap-3 rounded-lg border p-3.5 shadow-md"
        style={{
          background: 'color-mix(in srgb, var(--primary-soft) 60%, var(--card) 40%)',
          borderColor: 'color-mix(in srgb, var(--primary) 22%, var(--border))',
        }}
      >
        <CheckCircle2
          className="size-4 shrink-0"
          style={{ color: 'var(--primary)', marginTop: 2 }}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="font-medium text-sm leading-tight">Quote ready</div>
          <div
            className="text-xs leading-snug"
            style={{ color: 'var(--muted-foreground)' }}
          >
            $12,500 / yr &middot; 4 line items &middot; Open in editor
          </div>
        </div>
      </div>
    </div>
  );
}
