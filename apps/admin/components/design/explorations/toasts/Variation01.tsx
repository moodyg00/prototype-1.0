import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Info, X } from 'lucide-react';

type StackedToast = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
};

// @mock-start
const MOCK_STACK: StackedToast[] = [
  {
    icon: CheckCircle2,
    title: 'Invoice INV-2041 sent',
    description: 'Acme Co. &middot; $12,500.00 &middot; Due in 30 days',
    accent: 'var(--primary)',
  },
  {
    icon: Info,
    title: 'Sync complete',
    description: '142 records updated from Stripe',
    accent: 'var(--muted-foreground)',
  },
  {
    icon: CheckCircle2,
    title: '3 leads imported',
    description: 'From CSV &mdash; review the new contacts in Leads.',
    accent: 'var(--primary)',
  },
];
// @mock-end

export interface ToastStackedCornerProps {
  stack?: ReadonlyArray<StackedToast>;
}

export function ToastStackedCorner({ stack = MOCK_STACK }: ToastStackedCornerProps = {}) {
  return (
    <div
      className="relative h-[340px] w-full"
      style={{
        background:
          'radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--primary-soft) 80%, transparent) 0%, var(--background) 60%)',
      }}
    >
      <div
        className="px-6 py-6 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Page content area
      </div>

      <div className="absolute right-4 bottom-4 flex w-80 flex-col gap-2">
        {stack.map((toast, idx) => {
          const Icon = toast.icon;
          return (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-lg border p-3 shadow-lg"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
              }}
            >
              <Icon
                className="size-4 shrink-0"
                style={{ color: toast.accent, marginTop: 2 }}
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="font-medium text-sm leading-tight">{toast.title}</div>
                <div
                  className="text-xs leading-snug"
                  style={{ color: 'var(--muted-foreground)' }}
                  dangerouslySetInnerHTML={{ __html: toast.description }}
                />
              </div>
              <button
                type="button"
                className="-mr-1 -mt-0.5 rounded-md p-1 transition-colors hover:bg-[var(--muted)]"
                aria-label="Dismiss"
              >
                <X className="size-3" style={{ color: 'var(--muted-foreground)' }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
