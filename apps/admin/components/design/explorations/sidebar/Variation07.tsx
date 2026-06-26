import {
  Briefcase,
  Users,
  CreditCard,
  Megaphone,
  Server,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type AreaCard = {
  label: string;
  icon: LucideIcon;
  primary: string;
  primaryLabel: string;
  secondary: string;
  accent: string;
  accentSoft: string;
  active?: boolean;
};

// @mock-start
const MOCK_AREAS: AreaCard[] = [
  {
    label: 'Operations',
    icon: Briefcase,
    primary: '18',
    primaryLabel: 'open',
    secondary: '+4 today',
    accent: 'var(--primary)',
    accentSoft: 'var(--primary-soft)',
    active: true,
  },
  {
    label: 'Customers',
    icon: Users,
    primary: '482',
    primaryLabel: 'contacts',
    secondary: '12 new',
    accent: 'var(--info)',
    accentSoft: 'color-mix(in srgb, var(--info) 14%, transparent)',
  },
  {
    label: 'Invoices',
    icon: CreditCard,
    primary: '$48k',
    primaryLabel: 'outstanding',
    secondary: '4 overdue',
    accent: 'var(--warning)',
    accentSoft: 'color-mix(in srgb, var(--warning) 14%, transparent)',
  },
  {
    label: 'Growth',
    icon: TrendingUp,
    primary: '8',
    primaryLabel: 'campaigns',
    secondary: '+22% MoM',
    accent: 'var(--success)',
    accentSoft: 'color-mix(in srgb, var(--success) 14%, transparent)',
  },
  {
    label: 'Marketing',
    icon: Megaphone,
    primary: '3',
    primaryLabel: 'live ads',
    secondary: '$2.1k spent',
    accent: 'var(--primary)',
    accentSoft: 'var(--primary-soft)',
  },
  {
    label: 'Integrations',
    icon: Server,
    primary: '6',
    primaryLabel: 'connected',
    secondary: 'All healthy',
    accent: 'var(--success)',
    accentSoft: 'color-mix(in srgb, var(--success) 14%, transparent)',
  },
];
const MOCK_BRAND_NAME = 'Proto-2';
// @mock-end

export interface SidebarActivityCardsProps {
  areas?: ReadonlyArray<AreaCard>;
  brandName?: string;
}

export function SidebarActivityCards({
  areas = MOCK_AREAS,
  brandName = MOCK_BRAND_NAME,
}: SidebarActivityCardsProps) {
  return (
    <div className="flex min-h-[520px] w-full">
      <aside
        className="flex w-72 shrink-0 flex-col gap-2 p-3"
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div className="mb-2 flex items-center gap-2.5 px-1 py-2">
          <div
            className="grid size-7 place-items-center rounded-md font-bold text-white text-[11px]"
            style={{ background: 'var(--primary)' }}
          >
            P2
          </div>
          <span className="font-semibold tracking-tight">{brandName}</span>
        </div>

        {areas.map((area) => (
          <button
            key={area.label}
            type="button"
            className="group flex flex-col gap-2 rounded-xl border p-3 text-start transition-all hover:shadow-sm"
            style={{
              borderColor: area.active
                ? `color-mix(in srgb, ${area.accent} 36%, var(--border))`
                : 'var(--border)',
              background: area.active ? area.accentSoft : 'var(--card)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="grid size-7 place-items-center rounded-md"
                  style={{ background: area.accentSoft, color: area.accent }}
                >
                  <area.icon className="size-3.5" />
                </div>
                <span className="text-sm font-medium">{area.label}</span>
              </div>
              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                {area.secondary}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-lg tracking-tight" style={{ color: area.accent }}>
                {area.primary}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
                {area.primaryLabel}
              </span>
            </div>
          </button>
        ))}
      </aside>

      <div
        className="flex flex-1 items-center justify-center px-6 py-10 text-sm"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Activity sidebar — each section is a live status card
      </div>
    </div>
  );
}
