import { ArrowRight, MessageSquare, GitPullRequest, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

type Item = {
  icon: typeof MessageSquare;
  title: string;
  meta: string;
  when: string;
};

// @mock-start
const MOCK_ITEMS: Item[] = [
  { icon: MessageSquare, title: 'Vertex Labs replied to invoice INV-1042', meta: 'billing@vertex.io', when: '2m' },
  { icon: GitPullRequest, title: 'Aiden requested review on contract draft', meta: 'Helio Group · MSA-04', when: '14m' },
  { icon: CheckCircle2, title: 'Work order WO-4818 marked complete', meta: 'Acme Holdings · Boulder', when: '38m' },
  { icon: MessageSquare, title: 'New lead from website form', meta: 'hello@acmeholdings.com', when: '1h' },
  { icon: CheckCircle2, title: 'Payroll for May processed', meta: '$ 84,200 across 12 employees', when: '2h' },
  { icon: GitPullRequest, title: 'Maya pushed pricing update', meta: 'SKU-200 series · +4%', when: '4h' },
];
// @mock-end

export interface CardListProps {
  items?: ReadonlyArray<Item>;
}

export function CardList({ items = MOCK_ITEMS }: CardListProps) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      <Card className="p-0">
        <CardHeader className="flex flex-row items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Last 4 hours across your workspace
            </div>
          </div>
        </CardHeader>
        <div className="max-h-72 overflow-y-auto">
          <ul>
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 border-b px-5 py-3 last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {item.meta}
                    </div>
                  </div>
                  <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                    {item.when}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div
          className="flex items-center justify-center border-t px-5 py-2.5"
          style={{ borderColor: 'var(--border)' }}
        >
          <a
            href="#"
            className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:text-[var(--foreground)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            View all activity <ArrowRight className="size-3" />
          </a>
        </div>
      </Card>
    </div>
  );
}
