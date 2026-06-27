'use client';

import {
  Search,
  Bell,
  Plus,
  Briefcase,
  Building2,
  CreditCard,
  BarChart3,
  Settings,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Kbd } from '@/components/ui/kbd';

type PrimaryTab = {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

// @mock-start
const MOCK_PRIMARY_TABS: PrimaryTab[] = [
  { value: 'work-orders', label: 'Work Orders', icon: Briefcase, count: 18 },
  { value: 'clients', label: 'Clients', icon: Building2 },
  { value: 'invoices', label: 'Invoices', icon: CreditCard, count: 4 },
  { value: 'reports', label: 'Reports', icon: BarChart3 },
  { value: 'settings', label: 'Settings', icon: Settings },
];
const MOCK_BRAND_NAME = 'Proto-2';
const MOCK_WORKSPACE_NAME = 'Stonebridge Plumbing Co';
const MOCK_USER_INITIALS = 'JD';
// @mock-end

export interface HeaderSplitTabsProps {
  tabs?: ReadonlyArray<PrimaryTab>;
  brandName?: string;
  workspaceName?: string;
  userInitials?: string;
}

export function HeaderSplitTabs({
  tabs = MOCK_PRIMARY_TABS,
  brandName = MOCK_BRAND_NAME,
  workspaceName = MOCK_WORKSPACE_NAME,
  userInitials = MOCK_USER_INITIALS,
}: HeaderSplitTabsProps) {
  return (
    <header
      className="flex w-full flex-col"
      style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex items-center gap-3">
          <div
            className="grid size-8 place-items-center rounded-md font-bold text-white text-xs"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-sm tracking-tight">{brandName}</div>
            <div className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
              {workspaceName}
            </div>
          </div>
          <ChevronDown className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
        </div>

        <div className="ml-auto hidden w-80 lg:block">
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          New
        </Button>

        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        <Avatar className="size-8">
          <AvatarFallback style={{ background: 'var(--primary)', color: 'white' }}>{userInitials}</AvatarFallback>
        </Avatar>
      </div>

      <div className="px-4">
        <Tabs defaultValue="work-orders">
          <TabsList variant="underline" className="-mx-1">
            {tabs.map(({ value, label, icon: Icon, count }) => (
              <TabsTab key={value} value={value}>
                <Icon />
                <span>{label}</span>
                {count !== undefined && (
                  <span
                    className="ms-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-medium"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    {count}
                  </span>
                )}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
