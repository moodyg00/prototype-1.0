import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

type Stat = {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  spark: number[];
};

// @mock-start
const MOCK_STATS: Stat[] = [
  {
    label: 'Revenue (MTD)',
    value: '$ 184,210',
    delta: '+12.4%',
    trend: 'up',
    spark: [22, 28, 24, 32, 30, 38, 42, 41, 46, 50, 48, 56],
  },
  {
    label: 'Open work orders',
    value: '127',
    delta: '-4 vs yesterday',
    trend: 'down',
    spark: [42, 40, 38, 42, 44, 41, 39, 38, 36, 34, 32, 30],
  },
  {
    label: 'Avg. response time',
    value: '14 m',
    delta: '+2 m',
    trend: 'up',
    spark: [12, 11, 13, 14, 12, 13, 14, 15, 14, 15, 14, 16],
  },
];
// @mock-end

function Sparkline({ data, trend }: { data: number[]; trend: 'up' | 'down' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 100;
  const h = 28;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / Math.max(1, max - min)) * h;
      return `${x},${y}`;
    })
    .join(' ');
  const color = trend === 'up' ? 'var(--primary)' : 'var(--muted-foreground)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

export interface CardStatSparklineProps {
  stats?: ReadonlyArray<Stat>;
}

export function CardStatSparkline({ stats = MOCK_STATS }: CardStatSparklineProps) {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-3">
      {stats.map((s) => {
        const Trend = s.trend === 'up' ? TrendingUp : TrendingDown;
        return (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div
                  className="text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {s.label}
                </div>
                <div className="font-semibold text-3xl tabular-nums tracking-tight">{s.value}</div>
              </div>
              <Sparkline data={s.spark} trend={s.trend} />
            </div>
            <div
              className="mt-3 inline-flex items-center gap-1.5 text-xs"
              style={{
                color: s.trend === 'up' ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              <Trend className="size-3.5" />
              {s.delta}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
