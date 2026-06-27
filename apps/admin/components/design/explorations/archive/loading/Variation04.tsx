import { Skeleton } from '@/components/ui/skeleton';

// @mock-start
const MOCK_ROW_COUNT = 6;
// @mock-end

export interface LoadingListSkeletonProps {
  rowCount?: number;
}

export function LoadingListSkeleton({
  rowCount = MOCK_ROW_COUNT,
}: LoadingListSkeletonProps = {}) {
  return (
    <div className="p-6">
      <ul className="space-y-2">
        {Array.from({ length: rowCount }).map((_, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5" style={{ width: `${24 + ((i * 13) % 28)}%` }} />
                <Skeleton className="h-3 w-14" />
              </div>
              <Skeleton className="h-3" style={{ width: `${60 + ((i * 11) % 30)}%` }} />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-10 shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
