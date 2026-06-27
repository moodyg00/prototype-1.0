import { Check, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

type Status = 'done' | 'running' | 'pending' | 'failed';

type Step = {
  label: string;
  detail: string;
  status: Status;
};

// @mock-start
const MOCK_STEPS: Step[] = [
  { label: 'Prepare workspace snapshot', detail: 'Locked schemas at v124 · 218 MB', status: 'done' },
  { label: 'Export customers and contacts', detail: '12,408 rows · 64 columns', status: 'done' },
  { label: 'Export invoices and payments', detail: '8,420 of 9,840 · 7s remaining', status: 'running' },
  { label: 'Bundle attachments', detail: 'PDFs and receipts · streamed', status: 'pending' },
  { label: 'Encrypt and upload to S3', detail: 'AES-256 · vertex-prod bucket', status: 'pending' },
];
// @mock-end

function StatusDot({ status }: { status: Status }) {
  if (status === 'done') {
    return (
      <div
        className="grid size-6 place-items-center rounded-full"
        style={{ background: 'var(--primary)', color: 'white' }}
      >
        <Check className="size-3.5" />
      </div>
    );
  }
  if (status === 'running') {
    return (
      <div
        className="grid size-6 place-items-center rounded-full border"
        style={{
          background: 'var(--primary-soft)',
          borderColor: 'var(--primary)',
          color: 'var(--primary)',
        }}
      >
        <Spinner className="size-3.5" />
      </div>
    );
  }
  return (
    <div
      className="grid size-6 place-items-center rounded-full border-2 border-dashed"
      style={{
        background: 'transparent',
        borderColor: 'var(--border)',
        color: 'var(--muted-foreground)',
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: 'var(--muted-foreground)' }} />
    </div>
  );
}

export interface LoadingLongTaskProps {
  steps?: ReadonlyArray<Step>;
}

export function LoadingLongTask({ steps = MOCK_STEPS }: LoadingLongTaskProps = {}) {
  return (
    <div className="px-6 py-8">
      <div
        className="mx-auto max-w-xl rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-heading font-semibold text-lg">Exporting workspace</h3>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Started 32 seconds ago · 3 of 5 steps complete
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Spinner className="size-3" />
            Running
          </span>
        </div>

        <ol className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <StatusDot status={s.status} />
                {i < steps.length - 1 && (
                  <div
                    className="mt-1 w-px flex-1"
                    style={{
                      minHeight: 18,
                      background:
                        s.status === 'done'
                          ? 'var(--primary)'
                          : 'var(--border)',
                    }}
                  />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={
                      s.status === 'pending' ? { color: 'var(--muted-foreground)' } : undefined
                    }
                  >
                    {s.label}
                  </span>
                  {s.status === 'running' && (
                    <ChevronRight className="size-3" style={{ color: 'var(--primary)' }} />
                  )}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {s.detail}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
