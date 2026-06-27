import { Skeleton } from '@/components/ui/skeleton';

type AdminRouteLoadingProps = {
  title?: string;
  variant?: 'page' | 'workspace' | 'detail';
};

export function AdminRouteLoading({ title, variant = 'page' }: AdminRouteLoadingProps) {
  if (variant === 'workspace') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={title ?? 'Loading workspace'}>
        <div className="space-y-2 border-b border-border/40 pb-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
        <Skeleton className="h-10 w-full rounded-md" />
        <div className="admin-surface space-y-2 p-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className="space-y-6" aria-busy="true" aria-label={title ?? 'Loading detail'}>
        <div className="space-y-2 border-b border-border/40 pb-5">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-busy="true" aria-label={title ?? 'Loading page'}>
      <div className="space-y-2 border-b border-border/40 pb-5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44 rounded-lg" />
        <Skeleton className="h-44 rounded-lg" />
      </div>
    </div>
  );
}