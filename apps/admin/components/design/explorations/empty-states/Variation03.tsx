import { Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TipStep = {
  n: string;
  title: string;
  body: string;
};

// @mock-start
const MOCK_STEPS: TipStep[] = [
  {
    n: '01',
    title: 'Connect a data source',
    body: 'Import customers and jobs from QuickBooks, Stripe, or a CSV in under a minute.',
  },
  {
    n: '02',
    title: 'Invite a teammate',
    body: 'Two-person workspaces are free forever — perfect for a founder + ops lead.',
  },
  {
    n: '03',
    title: 'Run your first workflow',
    body: 'Let an agent draft an invoice from a closed job. Review, approve, send.',
  },
];
// @mock-end

export interface EmptyStateTipHowToProps {
  steps?: ReadonlyArray<TipStep>;
}

export function EmptyStateTipHowTo({ steps = MOCK_STEPS }: EmptyStateTipHowToProps = {}) {
  return (
    <div className="px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 place-items-center rounded-md"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Lightbulb className="size-4.5" />
          </div>
          <div>
            <div
              className="text-[10px] font-medium uppercase tracking-[0.18em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Tips · before you start
            </div>
            <h3 className="font-heading font-semibold text-lg">Three things to do first</h3>
          </div>
        </div>
        <ol className="mt-6 space-y-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="flex gap-4 rounded-xl border p-4"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div
                className="grid size-8 shrink-0 place-items-center rounded-md font-mono text-xs"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {s.n}
              </div>
              <div>
                <div className="font-medium text-sm">{s.title}</div>
                <p className="mt-0.5 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex justify-end">
          <Button size="sm" className="gap-1.5">
            Start setup <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
