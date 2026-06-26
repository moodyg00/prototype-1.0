import { Spinner } from '@/components/ui/spinner';

// @mock-start
// @mock-end

export interface LoadingSpinnerOnlyProps {}

export function LoadingSpinnerOnly(_props: LoadingSpinnerOnlyProps = {}) {
  return (
    <div className="grid place-items-center px-6 py-16">
      <Spinner className="size-6" style={{ color: 'var(--muted-foreground)' }} />
    </div>
  );
}
