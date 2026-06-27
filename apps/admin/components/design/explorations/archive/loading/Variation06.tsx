type Progress = {
  label: string;
  hint: string;
  pct: number;
};

// @mock-start
const MOCK_PROGRESS: Progress[] = [
  { label: 'Importing customers', hint: '8,420 of 12,000 records', pct: 70 },
  { label: 'Reconciling invoices', hint: '38 of 142', pct: 27 },
  { label: 'Uploading attachments', hint: '4.2 MB of 4.6 MB', pct: 92 },
];
// @mock-end

export interface LoadingProgressBarProps {
  items?: ReadonlyArray<Progress>;
}

export function LoadingProgressBar({ items = MOCK_PROGRESS }: LoadingProgressBarProps = {}) {
  return (
    <div className="space-y-4 p-6">
      {items.map((p) => (
        <div
          key={p.label}
          className="space-y-2 rounded-xl border p-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{p.label}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {p.hint}
              </div>
            </div>
            <div className="font-mono text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              {p.pct}%
            </div>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--muted)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ background: 'var(--primary)', width: `${p.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
