'use client';

import { useState } from 'react';
import {
  Briefcase,
  Users,
  CreditCard,
  Megaphone,
  Settings,
  Search,
  FileText,
  Building2,
  CheckSquare,
  Calendar,
  Inbox,
  BarChart3,
  Receipt,
  Tag,
  TrendingUp,
  Wrench,
  Layers,
  Layers2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type SectionItem = {
  label: string;
  icon: LucideIcon;
  count?: number;
};

type Section = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: SectionItem[];
};

// @mock-start
const MOCK_SECTIONS: Section[] = [
  {
    id: 'operate',
    label: 'Operate',
    icon: Briefcase,
    items: [
      { label: 'Inbox', icon: Inbox, count: 14 },
      { label: 'Calendar', icon: Calendar },
      { label: 'Work Orders', icon: Wrench, count: 18 },
      { label: 'Tasks', icon: CheckSquare, count: 6 },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    icon: Users,
    items: [
      { label: 'Contacts', icon: Users },
      { label: 'Organizations', icon: Building2 },
      { label: 'Segments', icon: Layers },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: CreditCard,
    items: [
      { label: 'Invoices', icon: Receipt, count: 4 },
      { label: 'Estimates', icon: FileText },
      { label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    icon: Megaphone,
    items: [
      { label: 'Campaigns', icon: TrendingUp },
      { label: 'Tags', icon: Tag },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'Workspace', icon: Layers2 },
      { label: 'Members', icon: Users },
    ],
  },
];
const MOCK_DEFAULT_SECTION_ID = 'operate';
// @mock-end

export interface SidebarDoublePaneProps {
  sections?: ReadonlyArray<Section>;
  defaultSectionId?: string;
}

export function SidebarDoublePane({
  sections = MOCK_SECTIONS,
  defaultSectionId = MOCK_DEFAULT_SECTION_ID,
}: SidebarDoublePaneProps) {
  const [activeId, setActiveId] = useState(defaultSectionId);
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-16 shrink-0 flex-col items-center gap-1 py-3"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="mb-3 grid size-9 place-items-center rounded-lg font-bold text-white text-xs"
          style={{ background: 'var(--primary)' }}
        >
          P2
        </div>
        {sections.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveId(section.id)}
              aria-label={section.label}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] transition-colors"
              style={
                isActive
                  ? { background: 'var(--primary-soft)', color: 'var(--primary)' }
                  : { color: 'var(--muted-foreground)' }
              }
            >
              <section.icon className="size-4" />
              <span className="font-medium tracking-tight">{section.label}</span>
            </button>
          );
        })}
      </aside>

      <aside
        className="flex w-60 shrink-0 flex-col"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div
          className="flex h-14 items-center gap-2 px-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <active.icon className="size-4" style={{ color: 'var(--primary)' }} />
          <span className="font-semibold tracking-tight">{active.label}</span>
        </div>

        <div className="px-3 py-3">
          <div
            className="flex h-8 items-center gap-2 rounded-md border px-2.5"
            style={{ borderColor: 'var(--border)' }}
          >
            <Search className="size-3.5" style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Filter {active.label.toLowerCase()}…
            </span>
          </div>
        </div>

        <ul className="flex flex-col gap-0.5 px-2 pb-3">
          {active.items.map((item, i) => (
            <li key={item.label}>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors"
                style={
                  i === 0
                    ? { background: 'var(--primary-soft)', color: 'var(--primary)', fontWeight: 500 }
                    : { color: 'var(--foreground)' }
                }
              >
                <item.icon className="size-4" />
                <span className="flex-1 text-start">{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className="rounded-full px-1.5 text-[10px] font-medium tabular-nums"
                    style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Double-pane: select a category, drill into items
      </div>
    </div>
  );
}
