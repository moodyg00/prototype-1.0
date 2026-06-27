'use client';

import { AdminRouteError } from '@/src/components/ui/AdminRouteError';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AdminRouteError error={error} reset={reset} />;
}