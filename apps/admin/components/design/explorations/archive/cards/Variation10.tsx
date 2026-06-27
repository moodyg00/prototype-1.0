import { Plus, FileText, FolderPlus, Bot, Webhook } from 'lucide-react';
import { Card } from '@/components/ui/card';

type Suggestion = { icon: typeof Plus; label: string; hint: string };

// @mock-start
const MOCK_SUGGESTIONS: Suggestion[] = [
  { icon: FileText, label: 'New invoice', hint: 'Draft a billable invoice' },
  { icon: FolderPlus, label: 'New project', hint: 'Group jobs under a deal' },
  { icon: Bot, label: 'Agent workflow', hint: 'Automate a repeatable task' },
  { icon: Webhook, label: 'Webhook', hint: 'Outbound event subscription' },
];
// @mock-end

export interface CardGhostAddNewProps {
  suggestions?: ReadonlyArray<Suggestion>;
}

export function CardGhostAddNew({ suggestions = MOCK_SUGGESTIONS }: CardGhostAddNewProps) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-3">
      <Card className="p-6">
        <div className="font-semibold">Existing card</div>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          A normal solid card for comparison so the dashed add-new affordance reads correctly next
          to its peers in a grid.
        </p>
      </Card>

      <Card className="p-6">
        <div className="font-semibold">Another existing card</div>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Same pattern, different content. The ghost card on the right is the focal demo.
        </p>
      </Card>

      <button
        type="button"
        className="group relative flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-transparent text-center transition-colors hover:bg-[var(--muted)]"
        style={{ borderColor: 'color-mix(in srgb, var(--border) 70%, var(--primary) 30%)' }}
      >
        <div
          className="grid size-10 place-items-center rounded-full transition-colors group-hover:bg-[var(--primary-soft)]"
          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          <Plus className="size-5" />
        </div>
        <div className="text-sm font-medium">Add something new</div>
        <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Click to pick a template
        </div>
      </button>

      <div className="md:col-span-3">
        <div
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Or choose a quick-start
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {suggestions.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.label}
                type="button"
                className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-left transition-colors hover:bg-[var(--muted)]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="grid size-9 place-items-center rounded-lg"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {s.hint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
