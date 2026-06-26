import {
  LayoutDashboard,
  Briefcase,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Settings,
  LifeBuoy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type IslandUser = {
  initials: string;
  name: string;
  role: string;
};

// @mock-start
const MOCK_ITEMS: NavItem[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Work Orders', icon: Briefcase, active: true },
  { label: 'Contacts', icon: Users },
  { label: 'Invoices', icon: CreditCard },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Marketing', icon: Megaphone },
];
const MOCK_FOOTER: NavItem[] = [
  { label: 'Help', icon: LifeBuoy },
  { label: 'Settings', icon: Settings },
];
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_BRAND_VERSION = 'v2.4.1';
const MOCK_USER: IslandUser = { initials: 'JD', name: 'Jordan', role: 'Owner' };
// @mock-end

export interface SidebarFloatingIslandProps {
  items?: ReadonlyArray<NavItem>;
  footer?: ReadonlyArray<NavItem>;
  brandName?: string;
  brandVersion?: string;
  user?: IslandUser;
}

export function SidebarFloatingIsland({
  items = MOCK_ITEMS,
  footer = MOCK_FOOTER,
  brandName = MOCK_BRAND_NAME,
  brandVersion = MOCK_BRAND_VERSION,
  user = MOCK_USER,
}: SidebarFloatingIslandProps) {
  return (
    <div
      className="flex min-h-[520px] w-full p-4"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--muted) 70%, var(--background)) 0%, var(--background) 100%)',
      }}
    >
      <aside
        className="flex w-60 shrink-0 flex-col rounded-2xl border p-3 shadow-lg/10"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="grid size-8 place-items-center rounded-lg font-bold text-white text-xs"
            style={{
              background:
                'linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 60%, var(--background)))',
            }}
          >
            P2
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm tracking-tight">{brandName}</div>
            <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {brandVersion}
            </div>
          </div>
        </div>

        <div className="my-2 h-px" style={{ background: 'var(--border)' }} />

        <nav className="flex-1">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
                  style={
                    item.active
                      ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 500 }
                      : { color: 'var(--foreground)' }
                  }
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="my-2 h-px" style={{ background: 'var(--border)' }} />

        <ul className="flex flex-col gap-0.5">
          {footer.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-[var(--muted)]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div
          className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2"
          style={{ background: 'var(--muted)' }}
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
        </div>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Floating island sidebar — separated from the chrome
      </div>
    </div>
  );
}
