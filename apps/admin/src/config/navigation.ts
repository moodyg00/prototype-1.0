/**
 * Canonical admin navigation for Proto-2.
 *
 * Mirrors Proto-1 Filament navigation groups + sort order 1:1:
 *   app/Providers/Filament/AdminPanelProvider.php (group order)
 *   app/Filament/Resources/**::$navigationGroup + $navigationSort
 *   app/Filament/Pages/**::$navigationGroup     + $navigationSort
 *
 * Source of truth: Proto-1. On any conflict, Proto-1 wins.
 *
 * Icons are lucide-react names. We use these instead of Heroicon names directly
 * because lucide is the default icon set bundled in this project.
 */

import type {
  LucideIcon,
} from 'lucide-react';
import {
  Briefcase,
  FileText,
  CalendarDays,
  Copy,
  Building2,
  Users,
  Mail,
  Phone,
  UserPlus,
  ListOrdered,
  BookOpen,
  Scale,
  CreditCard,
  RotateCw,
  Package,
  Wrench,
  BarChart3,
  Building,
  ArrowLeftRight,
  Receipt,
  Megaphone,
  Sparkles,
  Terminal,
  Server,
  Settings as SettingsIcon,
  ClipboardList,
  UsersRound,
  Palette,
  ImageUp,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  sort: number;
  /** Optional alternate matches for active-state. */
  match?: string[];
}

export interface NavGroup {
  label: string;
  sort: number;
  items: NavItem[];
}

/**
 * Group order is fixed by Proto-1 AdminPanelProvider.navigationGroups().
 * Item order is determined by `sort`. We expose both so the sidebar
 * can render groups in declaration order and items by sort.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    sort: 1,
    items: [
      { href: '/admin/uploads',                    label: 'Uploads',        icon: ImageUp,      sort: 0 },
      { href: '/admin/work-orders',                label: 'Work Orders',    icon: Briefcase,    sort: 1 },
      { href: '/admin/calendar',                   label: 'Calendar',       icon: CalendarDays, sort: 2, match: ['/admin/calendar/availability', '/admin/calendar/booking-links'] },
      { href: '/admin/estimates',                  label: 'Estimates',      icon: Copy,         sort: 5 },
      { href: '/admin/catalog',                    label: 'Catalog',        icon: Package,      sort: 6 },
      { href: '/admin/offerings',                  label: 'Offerings',      icon: Wrench,       sort: 7 },
    ],
  },
  {
    label: 'Customer Relations',
    sort: 2,
    items: [
      { href: '/admin/organizations', label: 'Organizations', icon: Building2, sort: 1 },
      { href: '/admin/contacts',      label: 'Contacts',      icon: Users,     sort: 2 },
      { href: '/admin/mail',          label: 'Mail',          icon: Mail,      sort: 3 },
      { href: '/admin/leads',         label: 'Leads',         icon: UserPlus,  sort: 4 },
      { href: '/admin/phone',         label: 'Phone',         icon: Phone,     sort: 5 },
    ],
  },
  {
    label: 'Accounting',
    sort: 3,
    items: [
      { href: '/admin/chart-of-accounts',   label: 'Chart of Accounts',  icon: ListOrdered, sort: 1 },
      { href: '/admin/journal-entries',     label: 'Journal Entries',    icon: BookOpen,    sort: 2 },
      { href: '/admin/ledger',              label: 'Ledger',             icon: Scale,       sort: 3 },
      { href: '/admin/accounting-reports',  label: 'Reports',            icon: BarChart3,   sort: 4 },
    ],
  },
  {
    label: 'Banking',
    sort: 4,
    items: [
      { href: '/admin/bank-accounts',     label: 'Bank Accounts', icon: Building,        sort: 1 },
      { href: '/admin/bank-transactions', label: 'Transactions',  icon: ArrowLeftRight,  sort: 2 },
      { href: '/admin/bank-cards',        label: 'Cards',         icon: CreditCard,      sort: 3 },
      { href: '/admin/invoices',          label: 'Invoices',      icon: FileText,        sort: 4 },
      { href: '/admin/recurring-invoices',label: 'Recurring',     icon: RotateCw,        sort: 5 },
      { href: '/admin/bills',             label: 'Bills',         icon: Receipt,         sort: 6 },
    ],
  },
  {
    label: 'Marketing & Ads',
    sort: 5,
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, sort: 1 },
      { href: '/admin/ads',       label: 'Ads',       icon: Megaphone, sort: 2 },
      { href: '/admin/campaigns', label: 'Campaigns', icon: Sparkles,  sort: 3 },
    ],
  },
  {
    label: 'Integrations',
    sort: 6,
    items: [
      { href: '/admin/api-integrations', label: 'API',          icon: Terminal, sort: 1 },
      { href: '/admin/credentials',      label: 'Credentials', icon: Server,   sort: 2 },
    ],
  },
  {
    label: 'Administration',
    sort: 7,
    items: [
      { href: '/admin/settings', label: 'Settings', icon: SettingsIcon,    sort: 1 },
      { href: '/admin/log',      label: 'Log',      icon: ClipboardList,   sort: 2 },
      { href: '/admin/users',    label: 'Users',    icon: UsersRound,      sort: 3 },
    ],
  },
  {
    label: 'Dev / Design',
    sort: 8,
    items: [
      { href: '/admin/design', label: 'Design', icon: Palette, sort: 1 },
    ],
  },
];

/**
 * Flat list of every nav target, useful for breadcrumbs / page titles
 * / route-existence checks.
 */
export const NAV_FLAT: NavItem[] = NAV_GROUPS.flatMap((g) =>
  [...g.items].sort((a, b) => a.sort - b.sort)
);

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_FLAT.find(
    (i) =>
      i.href === pathname ||
      i.match?.includes(pathname) ||
      (i.href !== '/admin' && pathname.startsWith(i.href))
  );
}

export function navGroupForPath(pathname: string): NavGroup | undefined {
  for (const g of NAV_GROUPS) {
    if (g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + '/'))) {
      return g;
    }
  }
  return undefined;
}
