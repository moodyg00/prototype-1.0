import { Spinner } from '@/components/ui/spinner';

// @mock-start
// @mock-end

export interface LoadingInlineLabelProps {}

export function LoadingInlineLabel(_props: LoadingInlineLabelProps = {}) {
  return (
    <div className="grid place-items-center px-6 py-16">
      <div
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
        style={{
          background: 'var(--card)',
          borderColor: 'var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        <Spinner className="size-3.5" />
        Fetching the latest 127 records
      </div>
    </div>
  );
}
