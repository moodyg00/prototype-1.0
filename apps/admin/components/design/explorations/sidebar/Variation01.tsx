import {
  Briefcase,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Server,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

type SidebarUser = {
  initials: string;
  name: string;
  role: string;
};

// @mock-start
const MOCK_GROUPS: NavGroup[] = [
  {
    label: 'Operate',
    items: [
      { label: 'Work Orders', icon: Briefcase, active: true },
      { label: 'Catalog', icon: Building2 },
    ],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Contacts', icon: Users },
      { label: 'Organizations', icon: Building2 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Invoices', icon: CreditCard },
      { label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Ads', icon: Megaphone },
      { label: 'Integrations', icon: Server },
    ],
  },
];
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_USER: SidebarUser = { initials: 'JD', name: 'Jordan Dahl', role: 'Owner' };
// @mock-end

export interface SidebarClassicGroupedProps {
  groups?: ReadonlyArray<NavGroup>;
  brandName?: string;
  user?: SidebarUser;
}

export function SidebarClassicGrouped({
  groups = MOCK_GROUPS,
  brandName = MOCK_BRAND_NAME,
  user = MOCK_USER,
}: SidebarClassicGroupedProps) {
  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-64 shrink-0 flex-col"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex h-14 items-center gap-2.5 px-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="grid size-7 place-items-center rounded-md font-bold text-white text-[11px]"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>
          <span className="font-semibold tracking-tight">{brandName}</span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div
                className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {group.label}
              </div>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
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
                      <span>{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="flex items-center gap-2 px-3 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Avatar className="size-7">
            <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-xs font-medium">{user.name}</div>
            <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {user.role}
            </div>
          </div>
          <button
            type="button"
            className="ml-auto grid size-7 place-items-center rounded-md transition-colors hover:bg-[var(--muted)]"
            aria-label="Account menu"
          >
            <ChevronDown className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        </div>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Page content area — sidebar sits to the left
      </div>
    </div>
  );
}
