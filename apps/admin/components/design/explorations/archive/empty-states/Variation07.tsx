import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// @mock-start
// @mock-end

export interface EmptyStateLoadingFinishedProps {}

export function EmptyStateLoadingFinished(_props: EmptyStateLoadingFinishedProps = {}) {
  return (
    <div className="p-6">
      <div className="space-y-2">
        <div
          className="flex items-center gap-3 rounded-lg border p-3"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="size-8 rounded-md" style={{ background: 'var(--muted)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-2/3 rounded" style={{ background: 'var(--muted)' }} />
            <div className="h-2 w-1/2 rounded" style={{ background: 'var(--muted)' }} />
          </div>
          <div className="h-6 w-16 rounded" style={{ background: 'var(--muted)' }} />
        </div>
        <div
          className="flex items-center gap-3 rounded-lg border p-3"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="size-8 rounded-md" style={{ background: 'var(--muted)' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded" style={{ background: 'var(--muted)' }} />
            <div className="h-2 w-2/5 rounded" style={{ background: 'var(--muted)' }} />
          </div>
          <div className="h-6 w-16 rounded" style={{ background: 'var(--muted)' }} />
        </div>
      </div>

      <div className="my-2 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          That&apos;s all we found
        </span>
        <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
      </div>

      <div
        className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="grid size-9 place-items-center rounded-full"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
        >
          <CheckCircle2 className="size-4.5" />
        </div>
        <div>
          <div className="font-semibold">All caught up</div>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Finished loading 2 of 2 results. Pull to check for anything new.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="size-3.5" />
          Check again
        </Button>
      </div>
    </div>
  );
}
