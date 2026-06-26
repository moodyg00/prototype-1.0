import {
  Search,
  Bell,
  ChevronDown,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';

type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

// @mock-start
const MOCK_NAV: NavItem[] = [
  { label: 'Operations', icon: Briefcase, active: true },
  { label: 'Clients', icon: Users },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Settings', icon: Settings },
];
const MOCK_BRAND_INITIALS = 'P2';
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_SEARCH_PLACEHOLDER = 'Search work, contacts, invoices...';
const MOCK_USER_INITIALS = 'JD';
const MOCK_NOTIFICATION_COUNT = 3;
// @mock-end

export interface HeaderClassicShellProps {
  nav?: ReadonlyArray<NavItem>;
  brandInitials?: string;
  brandName?: string;
  searchPlaceholder?: string;
  userInitials?: string;
  notificationCount?: number;
}

export function HeaderClassicShell({
  nav = MOCK_NAV,
  brandInitials = MOCK_BRAND_INITIALS,
  brandName = MOCK_BRAND_NAME,
  searchPlaceholder = MOCK_SEARCH_PLACEHOLDER,
  userInitials = MOCK_USER_INITIALS,
  notificationCount = MOCK_NOTIFICATION_COUNT,
}: HeaderClassicShellProps) {
  return (
    <header
      className="flex h-14 w-full items-center gap-6 px-6"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="grid size-8 place-items-center rounded-md font-semibold text-white text-xs"
          style={{ background: 'var(--primary)' }}
        >
          {brandInitials}
        </div>
        <div className="font-semibold tracking-tight">{brandName}</div>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {nav.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className="flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors"
            style={
              active
                ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                : { color: 'var(--muted-foreground)' }
            }
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden w-72 lg:block">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder={searchPlaceholder} />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          New
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <span className="relative inline-flex">
            <Bell className="size-4" />
            <Badge
              variant="default"
              size="sm"
              className="-right-1.5 -top-1.5 absolute h-3.5 min-w-3.5 px-1 text-[10px]"
            >
              {notificationCount}
            </Badge>
          </span>
        </Button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-full pe-2 transition-colors hover:bg-[var(--muted)]"
          aria-label="User menu"
        >
          <Avatar className="size-7">
            <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
        </button>
      </div>
    </header>
  );
}
