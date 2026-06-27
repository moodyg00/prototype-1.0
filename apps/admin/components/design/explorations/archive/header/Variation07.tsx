import {
  Menu as MenuIcon,
  Briefcase,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Server,
  ArrowRight,
  Sparkles,
  Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  MenuPopup,
  MenuTrigger,
} from '@/components/ui/menu';

type MegaMenuItem = {
  icon: LucideIcon;
  label: string;
  desc: string;
};

type MegaMenuGroup = {
  label: string;
  items: MegaMenuItem[];
};

// @mock-start
const MOCK_MEGA_GROUPS: MegaMenuGroup[] = [
  {
    label: 'Operations',
    items: [
      { icon: Briefcase, label: 'Work Orders', desc: '18 active' },
      { icon: Building2, label: 'Catalog', desc: 'Service & products' },
    ],
  },
  {
    label: 'Customer',
    items: [
      { icon: Users, label: 'Contacts', desc: '482 records' },
      { icon: Building2, label: 'Organizations', desc: '64 active' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { icon: CreditCard, label: 'Invoices', desc: '14 due' },
      { icon: BarChart3, label: 'Reports', desc: 'Monthly close' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { icon: Megaphone, label: 'Ads', desc: '8 running' },
      { icon: Server, label: 'Integrations', desc: '6 connected' },
    ],
  },
];
const MOCK_PAGE_TITLE = 'Work Orders';
const MOCK_STATUS_LABEL = '18 active';
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderMegaMenuProps {
  groups?: ReadonlyArray<MegaMenuGroup>;
  pageTitle?: string;
  statusLabel?: string;
  userInitials?: string;
}

export function HeaderMegaMenu({
  groups = MOCK_MEGA_GROUPS,
  pageTitle = MOCK_PAGE_TITLE,
  statusLabel = MOCK_STATUS_LABEL,
  userInitials = MOCK_USER_INITIALS,
}: HeaderMegaMenuProps) {
  return (
    <header
      className="flex h-14 w-full items-center gap-4 px-5"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <Menu>
        <MenuTrigger
          render={<Button variant="outline" size="sm" className="gap-2" />}
        >
          <MenuIcon className="size-4" />
          <span className="hidden sm:inline">All sections</span>
        </MenuTrigger>
        <MenuPopup align="start" className="w-[640px] p-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.label}>
                <div
                  className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {group.label}
                </div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="flex items-start gap-2.5 rounded-md p-2 text-start transition-colors hover:bg-[var(--muted)]"
                    >
                      <item.icon className="mt-0.5 size-4" style={{ color: 'var(--primary)' }} />
                      <div className="leading-tight">
                        <div className="text-sm font-medium">{item.label}</div>
                        <div
                          className="text-[11px]"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-3 flex items-center justify-between rounded-md px-3 py-2"
            style={{ background: 'var(--muted)' }}
          >
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Looking for something specific?
            </span>
            <Button size="xs" variant="ghost" className="gap-1.5">
              Open command palette
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </MenuPopup>
      </Menu>

      <div className="flex items-center gap-2">
        <div
          className="grid size-7 place-items-center rounded-md font-bold text-white text-[11px]"
          style={{ background: 'var(--primary)' }}
        >
          P2
        </div>
        <div className="hidden font-semibold tracking-tight md:block">{pageTitle}</div>
        <Badge variant="outline" size="sm">
          {statusLabel}
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="size-3.5" style={{ color: 'var(--primary)' }} />
          <span className="hidden sm:inline">Ask agent</span>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>
        <Avatar className="size-8">
          <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
