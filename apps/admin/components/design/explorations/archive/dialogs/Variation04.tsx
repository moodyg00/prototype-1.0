import { X, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Step = { label: string; done?: boolean; active?: boolean };

// @mock-start
const MOCK_STEPS: Step[] = [
  { label: 'Workspace', done: true },
  { label: 'Brand', done: true },
  { label: 'Integrations', active: true },
  { label: 'Invite team' },
  { label: 'Review' },
];
const MOCK_TOOLS: string[] = ['Stripe', 'QuickBooks', 'Gmail', 'Slack', 'HubSpot', 'Twilio'];
// @mock-end

export interface DialogFullScreenProps {
  steps?: ReadonlyArray<Step>;
  tools?: ReadonlyArray<string>;
}

export function DialogFullScreen({
  steps = MOCK_STEPS,
  tools = MOCK_TOOLS,
}: DialogFullScreenProps) {
  return (
    <div
      className="relative flex h-[520px] flex-col"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="flex items-center justify-between border-b px-8 py-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="grid size-8 place-items-center rounded-md font-semibold text-white text-xs"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>
          <div>
            <div className="font-semibold tracking-tight">Onboarding</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Step 3 of 5 &middot; Connect your tools
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-[var(--muted)]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Close
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="hidden w-56 shrink-0 border-r px-5 py-6 md:block"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div
            className="mb-3 text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Progress
          </div>
          <ol className="space-y-1">
            {steps.map((step) => (
              <li
                key={step.label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                style={{
                  background: step.active ? 'var(--primary-soft)' : 'transparent',
                  color: step.active
                    ? 'var(--primary)'
                    : step.done
                      ? 'var(--foreground)'
                      : 'var(--muted-foreground)',
                  fontWeight: step.active ? 500 : 400,
                }}
              >
                <span
                  className="grid size-4 place-items-center rounded-full text-[10px]"
                  style={{
                    background: step.done
                      ? 'var(--primary)'
                      : step.active
                        ? 'var(--primary)'
                        : 'var(--muted)',
                    color: step.done || step.active ? 'white' : 'var(--muted-foreground)',
                  }}
                >
                  {step.done ? <Check className="size-2.5" /> : null}
                </span>
                {step.label}
              </li>
            ))}
          </ol>
        </aside>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-2xl space-y-4">
            <h2 className="font-semibold text-2xl tracking-tight">Connect the tools you already use</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              We&rsquo;ll mirror data both ways and keep your existing source of truth in sync. Pick
              what you have today &mdash; you can change this later.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-8 rounded-md"
                      style={{
                        background: 'color-mix(in srgb, var(--primary) 12%, var(--muted))',
                      }}
                    />
                    <span className="font-medium text-sm">{tool}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between border-t px-8 py-4"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <Button variant="ghost" size="sm">
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Skip for now
          </Button>
          <Button size="sm" className="gap-1.5">
            Continue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
