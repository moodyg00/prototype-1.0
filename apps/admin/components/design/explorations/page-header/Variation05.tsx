import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Plus, Download } from 'lucide-react';

type HeroStat = {
  label: string;
  value: string;
  delta: string;
  up: boolean;
};

// @mock-start
const MOCK_STATS: HeroStat[] = [
  { label: 'Active work orders', value: '18', delta: '+3', up: true },
  { label: 'Outstanding revenue', value: '$48,200', delta: '+12%', up: true },
  { label: 'Avg resolution', value: '2.4 days', delta: '-0.6d', up: false },
  { label: 'CSAT', value: '4.8', delta: '+0.1', up: true },
];
const MOCK_EYEBROW = 'Operations / Dashboard';
const MOCK_TITLE = 'Good morning, Jordan.';
const MOCK_DESCRIPTION =
  "Here's what's on your plate today across customers, jobs, and revenue. Scroll for the full breakdown.";
// @mock-end

export interface PageHeaderHeroStatsProps {
  stats?: ReadonlyArray<HeroStat>;
  eyebrow?: string;
  title?: string;
  description?: string;
}

export function PageHeaderHeroStats({
  stats = MOCK_STATS,
  eyebrow = MOCK_EYEBROW,
  title = MOCK_TITLE,
  description = MOCK_DESCRIPTION,
}: PageHeaderHeroStatsProps) {
  return (
    <header
      className="px-6 py-7"
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--primary-soft) 65%, var(--card)) 0%, var(--card) 100%)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <div
            className="text-[10px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: 'var(--primary)' }}
          >
            {eyebrow}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Export
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            New work order
          </Button>
        </div>
      </div>

      <div
        className="mt-6 grid grid-cols-2 gap-4 rounded-xl border p-4 sm:grid-cols-4"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {stats.map((stat) => {
          const TrendIcon = stat.up ? TrendingUp : TrendingDown;
          const trendColor = stat.up ? 'var(--success)' : 'var(--destructive)';
          return (
            <div key={stat.label} className="space-y-1">
              <div
                className="text-[11px] uppercase tracking-[0.16em]"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {stat.label}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="font-semibold text-xl tracking-tight">{stat.value}</div>
                <div
                  className="inline-flex items-center gap-0.5 text-[11px] font-medium"
                  style={{ color: trendColor }}
                >
                  <TrendIcon className="size-3" />
                  {stat.delta}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
}
