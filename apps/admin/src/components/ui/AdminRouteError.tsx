'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type AdminRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
};

export function AdminRouteError({
  error,
  reset,
  title = 'Something went wrong',
}: AdminRouteErrorProps) {
  return (
    <div className="admin-surface max-w-2xl p-6">
      <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-600">
        <AlertCircle className="size-5" />
      </div>
      <h2 className="font-display text-xl font-medium tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This page hit an unexpected error. You can retry or navigate away and come back.
      </p>
      <p className="mt-4 border-t border-border/40 pt-4 font-mono text-xs text-red-600">
        {error.message || 'Unknown error'}
      </p>
      <Button type="button" onClick={reset} className="mt-4 gap-2">
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  );
}