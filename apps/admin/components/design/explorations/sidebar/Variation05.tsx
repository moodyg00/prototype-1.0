import {
  Search,
  ArrowRight,
  Briefcase,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Sparkles,
  Wrench,
  Receipt,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Kbd } from '@/components/ui/kbd';

type SuggestionItem = {
  label: string;
  icon: LucideIcon;
  hint?: string;
};

type SuggestionGroup = {
  section: string;
  items: SuggestionItem[];
};

// @mock-start
const MOCK_SUGGESTIONS: SuggestionGroup[] = [
  { section: 'Jump to', items: [
    { label: 'Today', icon: Briefcase, hint: 'g t' },
    { label: 'Inbox', icon: FileText, hint: 'g i' },
    { label: 'Reports', icon: BarChart3, hint: 'g r' },
  ]},
  { section: 'Recent', items: [
    { label: 'WO-1284 — Stonebridge install', icon: Wrench },
    { label: 'INV-0042 — Vertex Labs', icon: Receipt },
    { label: 'Acme Co.', icon: Users },
  ]},
  { section: 'Actions', items: [
    { label: 'New work order', icon: Briefcase, hint: 'n w' },
    { label: 'Send invoice', icon: CreditCard, hint: 'n i' },
  ]},
];
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_SEARCH_PLACEHOLDER = 'Search or run a command…';
const MOCK_FOOTER_HINT = 'Type to filter or ask the agent';
// @mock-end

export interface SidebarSearchLedProps {
  suggestions?: ReadonlyArray<SuggestionGroup>;
  brandName?: string;
  searchPlaceholder?: string;
  footerHint?: string;
}

export function SidebarSearchLed({
  suggestions = MOCK_SUGGESTIONS,
  brandName = MOCK_BRAND_NAME,
  searchPlaceholder = MOCK_SEARCH_PLACEHOLDER,
  footerHint = MOCK_FOOTER_HINT,
}: SidebarSearchLedProps) {
  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-72 shrink-0 flex-col"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex flex-col gap-3 px-4 pb-3 pt-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-7 place-items-center rounded-md font-bold text-white text-[11px]"
              style={{ background: 'var(--primary)' }}
            >
              P2
            </div>
            <span className="font-semibold tracking-tight">{brandName}</span>
          </div>
          <div
            className="flex h-9 items-center gap-2 rounded-lg border px-2.5"
            style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
          >
            <Search className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
            <span className="flex-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {searchPlaceholder}
            </span>
            <Kbd className="text-[10px]">⌘K</Kbd>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {suggestions.map((group) => (
            <div key={group.section} className="mb-4 last:mb-0">
              <div
                className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {group.section}
              </div>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
                    >
                      <item.icon className="size-4" style={{ color: 'var(--muted-foreground)' }} />
                      <span className="flex-1 truncate text-start">{item.label}</span>
                      {item.hint ? (
                        <Kbd className="text-[9px]">{item.hint}</Kbd>
                      ) : (
                        <ArrowRight className="size-3" style={{ color: 'var(--muted-foreground)' }} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="flex items-center gap-2 px-3 py-3 text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Sparkles className="size-3.5" style={{ color: 'var(--primary)' }} />
          <span>{footerHint}</span>
        </div>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Search-led nav — fuzzy match for everything
      </div>
    </div>
  );
}
