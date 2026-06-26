import type { LucideIcon } from 'lucide-react';
import { Check, Copy, Wifi, RefreshCw } from 'lucide-react';

type PillEntry = {
  icon: LucideIcon;
  label: string;
  accent: string;
  bg: string;
};

// @mock-start
const MOCK_PILLS: PillEntry[] = [
  {
    icon: Check,
    label: 'Saved',
    accent: 'var(--primary)',
    bg: 'var(--primary-soft)',
  },
  {
    icon: Copy,
    label: 'Copied to clipboard',
    accent: 'var(--foreground)',
    bg: 'color-mix(in srgb, var(--muted) 80%, var(--card) 20%)',
  },
  {
    icon: RefreshCw,
    label: 'Refreshing...',
    accent: 'var(--muted-foreground)',
    bg: 'color-mix(in srgb, var(--muted) 80%, var(--card) 20%)',
  },
  {
    icon: Wifi,
    label: 'Back online',
    accent: '#16a34a',
    bg: 'color-mix(in srgb, #16a34a 12%, var(--card) 88%)',
  },
];
// @mock-end

export interface ToastPillProps {
  pills?: ReadonlyArray<PillEntry>;
}

export function ToastPill({ pills = MOCK_PILLS }: ToastPillProps = {}) {
  return (
    <div
      className="flex h-[280px] flex-col items-center justify-center gap-3"
      style={{ background: 'var(--background)' }}
    >
      {pills.map((pill) => {
        const Icon = pill.icon;
        return (
          <div
            key={pill.label}
            className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-sm"
            style={{
              background: pill.bg,
              borderColor: 'var(--border)',
              color: pill.accent,
            }}
          >
            <Icon className="size-3.5" />
            {pill.label}
          </div>
        );
      })}
    </div>
  );
}
