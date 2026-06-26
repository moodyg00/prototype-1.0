import { Skeleton } from '@/components/ui/skeleton';

// @mock-start
// @mock-end

export interface LoadingSkeletonShimmerProps {}

export function LoadingSkeletonShimmer(_props: LoadingSkeletonShimmerProps = {}) {
  return (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      <div
        className="space-y-4 rounded-2xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Skeleton with a horizontal shimmer pass — the default coss{' '}
          <code className="font-mono">Skeleton</code> uses an animated linear-gradient highlight.
        </p>
      </div>

      <div
        className="space-y-4 rounded-2xl border p-5"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-3 flex-1" style={{ maxWidth: `${60 + ((i * 11) % 30)}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
