import { AlertOctagon, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorContext = {
  code: string;
  requestId: string;
  timestamp: string;
  environment: string;
  region: string;
};

// @mock-start
const MOCK_ERROR: ErrorContext = {
  code: 'UPSTREAM_TIMEOUT',
  requestId: 'req_4d2c9f1a',
  timestamp: '14:08:22',
  environment: 'proto-2-prod',
  region: 'iad-01',
};
// @mock-end

export interface EmptyStateErrorProps {
  error?: ErrorContext;
}

export function EmptyStateError({ error = MOCK_ERROR }: EmptyStateErrorProps = {}) {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div
          className="grid size-12 place-items-center rounded-xl border"
          style={{
            background: 'color-mix(in srgb, var(--card) 88%, oklch(0.78 0.18 28) 14%)',
            borderColor: 'color-mix(in srgb, var(--border) 50%, oklch(0.68 0.18 28) 50%)',
            color: 'oklch(0.55 0.2 28)',
          }}
        >
          <AlertOctagon className="size-5" />
        </div>
        <h3 className="mt-5 font-heading font-semibold text-xl">Couldn&apos;t load this page</h3>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          We hit an unexpected error while fetching your data. The team has been notified
          automatically. You can retry safely — no records were changed.
        </p>

        <div
          className="mt-5 w-full rounded-md border px-3 py-2 text-left font-mono text-[11px] leading-relaxed"
          style={{
            background: 'var(--muted)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <div>
            <span style={{ color: 'oklch(0.55 0.2 28)' }}>Error</span>{' '}
            <span>{error.code}</span>
          </div>
          <div>request_id: {error.requestId}</div>
          <div>{error.timestamp} · {error.environment} · {error.region}</div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button size="sm" className="gap-1.5">
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="size-3.5" />
            Status page
          </Button>
        </div>
      </div>
    </div>
  );
}
