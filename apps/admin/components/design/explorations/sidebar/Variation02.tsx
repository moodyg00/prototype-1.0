'use client';

import {
  Briefcase,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Megaphone,
  Server,
  ChevronRight,
  Inbox,
  Calendar,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@/components/ui/collapsible';

type LeafItem = { label: string; active?: boolean };
type Group = {
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: LeafItem[];
};

// @mock-start
const MOCK_GROUPS: Group[] = [
  {
    label: 'Operate',
    icon: Briefcase,
    defaultOpen: true,
    children: [
      { label: 'Inbox', active: true },
      { label: 'Calendar' },
      { label: 'Work Orders' },
      { label: 'Catalog' },
    ],
  },
  {
    label: 'Customers',
    icon: Users,
    children: [
      { label: 'Contacts' },
      { label: 'Organizations' },
      { label: 'Leads' },
    ],
  },
  {
    label: 'Finance',
    icon: CreditCard,
    children: [
      { label: 'Invoices' },
      { label: 'Estimates' },
      { label: 'Reports' },
    ],
  },
  {
    label: 'Growth',
    icon: Megaphone,
    children: [
      { label: 'Ads' },
      { label: 'Integrations' },
    ],
  },
];
const MOCK_LEAF_ICONS: Record<string, LucideIcon> = {
  Inbox,
  Calendar,
  'Work Orders': FileText,
  Catalog: Building2,
  Contacts: Users,
  Organizations: Building2,
  Leads: Users,
  Invoices: CreditCard,
  Estimates: FileText,
  Reports: BarChart3,
  Ads: Megaphone,
  Integrations: Server,
};
const MOCK_BRAND_NAME = 'Proto-2';
// @mock-end

export interface SidebarCollapsibleSectionsProps {
  groups?: ReadonlyArray<Group>;
  leafIcons?: Record<string, LucideIcon>;
  brandName?: string;
}

export function SidebarCollapsibleSections({
  groups = MOCK_GROUPS,
  leafIcons = MOCK_LEAF_ICONS,
  brandName = MOCK_BRAND_NAME,
}: SidebarCollapsibleSectionsProps) {
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

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {groups.map((group) => (
            <Collapsible key={group.label} defaultOpen={group.defaultOpen}>
              <CollapsibleTrigger
                render={
                  <button
                    type="button"
                    className="group/section flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--muted)]"
                  />
                }
              >
                <ChevronRight
                  className="size-3.5 transition-transform group-data-[panel-open]/section:rotate-90"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <group.icon className="size-4" style={{ color: 'var(--muted-foreground)' }} />
                <span className="font-medium">{group.label}</span>
              </CollapsibleTrigger>
              <CollapsiblePanel>
                <ul className="ms-2 mt-0.5 flex flex-col gap-0.5 ps-4" style={{ borderLeft: '1px solid var(--border)' }}>
                  {group.children.map((child) => {
                    const Icon = leafIcons[child.label] ?? FileText;
                    return (
                      <li key={child.label}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors"
                          style={
                            child.active
                              ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 500 }
                              : { color: 'var(--foreground)' }
                          }
                        >
                          <Icon className="size-3.5" />
                          {child.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CollapsiblePanel>
            </Collapsible>
          ))}
        </nav>
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
