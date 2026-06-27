import {
  Pin,
  Clock,
  Briefcase,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Settings,
  Receipt,
  Wrench,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type PinnedItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
};

type RecentItem = {
  label: string;
  icon: LucideIcon;
  time: string;
};

type SectionItem = {
  label: string;
  icon: LucideIcon;
};

// @mock-start
const MOCK_PINNED: PinnedItem[] = [
  { label: 'Today', icon: Briefcase, active: true },
  { label: 'Open invoices', icon: Receipt, badge: '4' },
  { label: 'High-priority work orders', icon: Wrench, badge: '3' },
];
const MOCK_RECENT: RecentItem[] = [
  { label: 'WO-1284 — Stonebridge', icon: Wrench, time: '2m' },
  { label: 'Acme Co.', icon: Building2, time: '1h' },
  { label: 'INV-0042 — Vertex Labs', icon: Receipt, time: '3h' },
];
const MOCK_SECTIONS: SectionItem[] = [
  { label: 'Operations', icon: Briefcase },
  { label: 'Customers', icon: Users },
  { label: 'Finance', icon: CreditCard },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Marketing', icon: Megaphone },
  { label: 'Settings', icon: Settings },
];
const MOCK_BRAND_NAME = 'Proto-2';
// @mock-end

export interface SidebarPinnedRecentProps {
  pinned?: ReadonlyArray<PinnedItem>;
  recent?: ReadonlyArray<RecentItem>;
  sections?: ReadonlyArray<SectionItem>;
  brandName?: string;
}

export function SidebarPinnedRecent({
  pinned = MOCK_PINNED,
  recent = MOCK_RECENT,
  sections = MOCK_SECTIONS,
  brandName = MOCK_BRAND_NAME,
}: SidebarPinnedRecentProps) {
  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-64 shrink-0 flex-col"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div className="flex h-14 items-center gap-2.5 px-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="grid size-7 place-items-center rounded-md font-bold text-white text-[11px]"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>
          <span className="font-semibold tracking-tight">{brandName}</span>
        </div>

        <div className="overflow-y-auto p-2">
          <div className="mb-4">
            <div
              className="flex items-center gap-1.5 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Pin className="size-3" />
              Pinned
            </div>
            <ul className="flex flex-col gap-0.5">
              {pinned.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors"
                    style={
                      item.active
                        ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 500 }
                        : { color: 'var(--foreground)' }
                    }
                  >
                    <item.icon className="size-4" />
                    <span className="flex-1 truncate text-start">{item.label}</span>
                    {item.badge && (
                      <span
                        className="rounded-full px-1.5 text-[10px] font-medium tabular-nums"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <div
              className="flex items-center gap-1.5 px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Clock className="size-3" />
              Recent
            </div>
            <ul className="flex flex-col gap-0.5">
              {recent.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
                  >
                    <item.icon className="size-4" style={{ color: 'var(--muted-foreground)' }} />
                    <span className="flex-1 truncate text-start">{item.label}</span>
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                      {item.time}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div
              className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Sections
            </div>
            <ul className="flex flex-col gap-0.5">
              {sections.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
                  >
                    <item.icon className="size-4" style={{ color: 'var(--muted-foreground)' }} />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Pinned + recent surfaces above the section list
      </div>
    </div>
  );
}
