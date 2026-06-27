import { Search, ArrowRight, FileText, User, Receipt, Settings, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

type ResultItem = { icon: LucideIcon; label: string; shortcut: string };
type ResultGroup = { group: string; items: ResultItem[] };

// @mock-start
const MOCK_RESULTS: ResultGroup[] = [
  {
    group: 'Suggestions',
    items: [
      { icon: Sparkles, label: 'Ask agent: summarize last week', shortcut: '↵' },
      { icon: FileText, label: 'Create new work order', shortcut: 'N' },
    ],
  },
  {
    group: 'Recent',
    items: [
      { icon: Receipt, label: 'Invoice #INV-2041 &mdash; Acme Co.', shortcut: '' },
      { icon: User, label: 'Jane Doe &mdash; Lead', shortcut: '' },
      { icon: Settings, label: 'Billing settings', shortcut: '' },
    ],
  },
];
const MOCK_QUERY = 'invoice';
// @mock-end

export interface DialogCommandPaletteProps {
  results?: ReadonlyArray<ResultGroup>;
  query?: string;
}

export function DialogCommandPalette({
  results = MOCK_RESULTS,
  query = MOCK_QUERY,
}: DialogCommandPaletteProps) {
  return (
    <div
      className="relative grid place-items-start px-6 pt-16 pb-10"
      style={{
        background: 'color-mix(in srgb, var(--foreground) 16%, var(--background))',
      }}
    >
      <div
        className="mx-auto w-full max-w-xl overflow-hidden rounded-xl border shadow-2xl"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <Search className="size-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[color:var(--muted-foreground)]"
            placeholder="Search work, contacts, settings or run an action..."
            defaultValue={query}
            readOnly
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {results.map((group) => (
            <div key={group.group} className="px-2 py-1">
              <div
                className="px-2 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {group.group}
              </div>
              <ul>
                {group.items.map((item, i) => {
                  const isActive = group.group === 'Suggestions' && i === 0;
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.label}
                      className="flex items-center gap-3 rounded-md px-2 py-2 text-sm"
                      style={{
                        background: isActive ? 'var(--primary-soft)' : 'transparent',
                        color: isActive ? 'var(--primary)' : 'var(--foreground)',
                      }}
                    >
                      <Icon className="size-4 opacity-80" />
                      <span
                        className="flex-1 truncate"
                        dangerouslySetInnerHTML={{ __html: item.label }}
                      />
                      {item.shortcut ? <Kbd>{item.shortcut}</Kbd> : null}
                      {isActive ? (
                        <ArrowRight className="size-3.5" style={{ color: 'var(--primary)' }} />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between gap-2 border-t px-4 py-2 text-[11px]"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
            background: 'color-mix(in srgb, var(--muted) 60%, var(--card) 40%)',
          }}
        >
          <div className="flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>navigate</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>↵</Kbd>
            <span>select</span>
          </div>
          <div className="flex items-center gap-2">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <span>toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
