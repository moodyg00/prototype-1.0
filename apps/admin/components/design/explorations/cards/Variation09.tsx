import { AlertTriangle, Info, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Callout = {
  tone: 'warning' | 'info' | 'success' | 'agent';
  icon: typeof AlertTriangle;
  title: string;
  body: string;
  cta?: string;
};

// @mock-start
const MOCK_CALLOUTS: Callout[] = [
  {
    tone: 'warning',
    icon: AlertTriangle,
    title: 'Storage at 84% of plan limit',
    body: 'You have 14 days of headroom at current growth. Upgrade your plan or archive old workspaces to keep ingest running.',
    cta: 'Manage storage',
  },
  {
    tone: 'info',
    icon: Info,
    title: 'New: per-record audit logs',
    body: 'Every read and write to customer records is now logged with actor, timestamp, and source. Enabled on all workspaces by default.',
  },
  {
    tone: 'success',
    icon: CheckCircle2,
    title: 'Backup completed',
    body: 'Last nightly backup finished in 4m 12s and verified against the previous snapshot. No anomalies detected.',
  },
  {
    tone: 'agent',
    icon: Sparkles,
    title: 'Agent noticed something',
    body: '3 invoices are past due by more than 30 days. I can draft polite follow-up emails for you to review.',
    cta: 'Review drafts',
  },
];
// @mock-end

const TONE = {
  warning: {
    bg: 'color-mix(in srgb, var(--card) 88%, oklch(0.84 0.16 80) 12%)',
    border: 'color-mix(in srgb, var(--border) 60%, oklch(0.78 0.16 80) 40%)',
    icon: 'oklch(0.62 0.16 60)',
  },
  info: {
    bg: 'color-mix(in srgb, var(--card) 88%, var(--primary-soft) 24%)',
    border: 'color-mix(in srgb, var(--border) 50%, var(--primary) 30%)',
    icon: 'var(--primary)',
  },
  success: {
    bg: 'color-mix(in srgb, var(--card) 88%, oklch(0.86 0.12 150) 14%)',
    border: 'color-mix(in srgb, var(--border) 60%, oklch(0.72 0.16 150) 40%)',
    icon: 'oklch(0.55 0.16 150)',
  },
  agent: {
    bg: 'color-mix(in srgb, var(--card) 84%, var(--primary-soft) 30%)',
    border: 'color-mix(in srgb, var(--border) 40%, var(--primary) 40%)',
    icon: 'var(--primary)',
  },
} as const;

export interface CardCalloutAlertProps {
  callouts?: ReadonlyArray<Callout>;
}

export function CardCalloutAlert({ callouts = MOCK_CALLOUTS }: CardCalloutAlertProps) {
  return (
    <div className="grid gap-3 p-6 md:grid-cols-2">
      {callouts.map((c) => {
        const Icon = c.icon;
        const t = TONE[c.tone];
        return (
          <div
            key={c.title}
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{ background: t.bg, borderColor: t.border }}
          >
            <div
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md"
              style={{ background: 'var(--card)', color: t.icon, border: `1px solid ${t.border}` }}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm">{c.title}</div>
              <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {c.body}
              </p>
              {c.cta && (
                <div className="mt-2">
                  <Button variant="outline" size="sm">
                    {c.cta}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
