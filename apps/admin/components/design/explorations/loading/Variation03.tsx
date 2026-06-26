import { Skeleton } from '@/components/ui/skeleton';

// @mock-start
const MOCK_ROW_COUNT = 6;
// @mock-end

export interface LoadingFullPageSkeletonProps {
  rowCount?: number;
}

export function LoadingFullPageSkeleton({
  rowCount = MOCK_ROW_COUNT,
}: LoadingFullPageSkeletonProps = {}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      <div
        className="mt-6 overflow-hidden rounded-xl border"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center gap-4 px-3 py-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="ml-auto h-3 w-24" />
        </div>
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-3 py-3"
            style={i < rowCount - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3" style={{ width: `${30 + ((i * 17) % 40)}%` }} />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
