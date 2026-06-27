import {
  ChevronsUpDown,
  Briefcase,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Server,
  Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

type NavItem = {
  label: string;
  icon: LucideIcon;
  count?: number;
  active?: boolean;
};

type Workspace = {
  initials: string;
  name: string;
  meta: string;
};

type AccountUser = {
  initials: string;
  name: string;
  email: string;
  notificationCount: number;
};

// @mock-start
const MOCK_NAV: NavItem[] = [
  { label: 'Work Orders', icon: Briefcase, count: 18, active: true },
  { label: 'Contacts', icon: Users, count: 482 },
  { label: 'Invoices', icon: CreditCard, count: 4 },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Integrations', icon: Server },
  { label: 'Settings', icon: Settings },
];
const MOCK_WORKSPACE: Workspace = {
  initials: 'SP',
  name: 'Stonebridge Plumbing',
  meta: 'Pro plan · 12 seats',
};
const MOCK_USER: AccountUser = {
  initials: 'JD',
  name: 'Jordan Dahl',
  email: 'jordan@stonebridge.co',
  notificationCount: 2,
};
// @mock-end

export interface SidebarWorkspaceSwitcherProps {
  nav?: ReadonlyArray<NavItem>;
  workspace?: Workspace;
  user?: AccountUser;
}

export function SidebarWorkspaceSwitcher({
  nav = MOCK_NAV,
  workspace = MOCK_WORKSPACE,
  user = MOCK_USER,
}: SidebarWorkspaceSwitcherProps) {
  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-64 shrink-0 flex-col"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <button
          type="button"
          className="m-2 flex items-center gap-2.5 rounded-lg border p-2.5 text-start transition-colors hover:bg-[var(--muted)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="grid size-8 shrink-0 place-items-center rounded-md font-bold text-white text-xs"
            style={{ background: 'var(--primary)' }}
          >
            {workspace.initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold">{workspace.name}</div>
            <div className="truncate text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {workspace.meta}
            </div>
          </div>
          <ChevronsUpDown className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
        </button>

        <nav className="flex-1 overflow-y-auto px-2 py-1">
          <ul className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors"
                  style={
                    item.active
                      ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 500 }
                      : { color: 'var(--foreground)' }
                  }
                >
                  <item.icon className="size-4" />
                  <span className="flex-1 text-start">{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className="rounded-full px-1.5 text-[10px] font-medium tabular-nums"
                      style={
                        item.active
                          ? { background: 'color-mix(in srgb, var(--primary) 20%, transparent)', color: 'var(--primary)' }
                          : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                      }
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-3 flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Plus className="size-4" />
            New project
          </button>
        </nav>

        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <Avatar className="size-7">
            <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-xs font-medium">{user.name}</div>
            <div className="truncate text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
              {user.email}
            </div>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="relative grid size-7 place-items-center rounded-md transition-colors hover:bg-[var(--muted)]"
          >
            <Bell className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
            <Badge
              variant="default"
              size="sm"
              className="-right-1 -top-1 absolute h-3.5 min-w-3.5 px-1 text-[10px]"
            >
              {user.notificationCount}
            </Badge>
          </button>
        </div>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Workspace switcher header anchors the rail
      </div>
    </div>
  );
}
