import { Skeleton } from '@/components/ui/skeleton';

// @mock-start
const MOCK_CARD_COUNT = 6;
// @mock-end

export interface LoadingCardGridSkeletonProps {
  cardCount?: number;
}

export function LoadingCardGridSkeleton({
  cardCount = MOCK_CARD_COUNT,
}: LoadingCardGridSkeletonProps = {}) {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: cardCount }).map((_, i) => (
        <div
          key={i}
          className="space-y-4 rounded-2xl border p-5"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-7 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
