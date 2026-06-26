import { Card } from '@/components/ui/card';

type Metric = {
  label: string;
  value: string;
  comparison: { label: string; value: string };
  bars: number[];
};

// @mock-start
const MOCK_METRICS: Metric[] = [
  {
    label: 'Monthly recurring revenue',
    value: '$ 42,180',
    comparison: { label: 'vs last month', value: '+ $ 4,810' },
    bars: [22, 26, 24, 30, 32, 36, 38, 35, 40, 42, 38, 44],
  },
  {
    label: 'New customers',
    value: '38',
    comparison: { label: 'vs last month', value: '+ 12' },
    bars: [4, 6, 5, 9, 7, 10, 12, 14, 11, 16, 15, 12],
  },
  {
    label: 'Churn rate',
    value: '2.4%',
    comparison: { label: 'vs last month', value: '- 0.6 pts' },
    bars: [4, 4, 3, 3, 4, 3, 3, 2, 3, 2, 2, 2],
  },
  {
    label: 'Avg. ticket value',
    value: '$ 1,184',
    comparison: { label: 'vs last month', value: '+ $ 92' },
    bars: [10, 12, 11, 13, 14, 12, 14, 16, 15, 17, 16, 18],
  },
];
// @mock-end

function BarStrip({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-8 items-end gap-0.5">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${(v / max) * 100}%`,
            background:
              i === data.length - 1
                ? 'var(--primary)'
                : 'color-mix(in srgb, var(--primary) 32%, var(--muted) 68%)',
          }}
        />
      ))}
    </div>
  );
}

export interface CardMetricComparisonProps {
  metrics?: ReadonlyArray<Metric>;
}

export function CardMetricComparison({ metrics = MOCK_METRICS }: CardMetricComparisonProps) {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((m) => (
        <Card key={m.label} className="gap-4 p-5">
          <div
            className="text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {m.label}
          </div>
          <div className="font-semibold text-2xl tabular-nums tracking-tight">{m.value}</div>
          <BarStrip data={m.bars} />
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: 'var(--muted-foreground)' }}>{m.comparison.label}</span>
            <span className="font-medium" style={{ color: 'var(--primary)' }}>
              {m.comparison.value}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}
