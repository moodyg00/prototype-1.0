import { Check, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Task = { label: string; status: 'done' | 'todo'; hint: string };

// @mock-start
const MOCK_TASKS: Task[] = [
  { label: 'Create your workspace', status: 'done', hint: 'Done in 18 seconds — nice.' },
  { label: 'Invite your first teammate', status: 'done', hint: 'Aiden joined yesterday.' },
  { label: 'Connect a data source', status: 'todo', hint: 'Stripe, QuickBooks, or CSV.' },
  { label: 'Set up a billing profile', status: 'todo', hint: 'Required to send invoices.' },
  { label: 'Launch your first agent workflow', status: 'todo', hint: 'Optional but recommended.' },
];
// @mock-end

export interface EmptyStateGettingStartedProps {
  tasks?: ReadonlyArray<Task>;
}

export function EmptyStateGettingStarted({
  tasks = MOCK_TASKS,
}: EmptyStateGettingStartedProps = {}) {
  const done = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="px-6 py-12">
      <div
        className="mx-auto max-w-xl rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="grid size-9 place-items-center rounded-lg"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg">Get your workspace ready</h3>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {done} of {tasks.length} steps complete · about 4 minutes left
            </div>
          </div>
        </div>

        <div
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: 'var(--muted)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              background: 'var(--primary)',
              width: `${(done / tasks.length) * 100}%`,
            }}
          />
        </div>

        <ul className="mt-5 space-y-1">
          {tasks.map((t) => {
            const Icon = t.status === 'done' ? Check : Circle;
            return (
              <li
                key={t.label}
                className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-[var(--muted)]"
              >
                <div
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full"
                  style={
                    t.status === 'done'
                      ? { background: 'var(--primary)', color: 'white' }
                      : {
                          background: 'transparent',
                          border: '1px dashed var(--border)',
                          color: 'var(--muted-foreground)',
                        }
                  }
                >
                  <Icon className="size-3" />
                </div>
                <div className="flex-1">
                  <div
                    className={`text-sm font-medium ${
                      t.status === 'done' ? 'line-through' : ''
                    }`}
                    style={t.status === 'done' ? { color: 'var(--muted-foreground)' } : undefined}
                  >
                    {t.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {t.hint}
                  </div>
                </div>
                {t.status === 'todo' && (
                  <ArrowRight className="mt-1 size-3.5" style={{ color: 'var(--muted-foreground)' }} />
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex justify-end">
          <Button size="sm">Continue setup</Button>
        </div>
      </div>
    </div>
  );
}
