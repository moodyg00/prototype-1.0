'use client';

import { AlertCircle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="max-w-2xl rounded-3xl border shadow-xs/10">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-red-500/10 text-red-600">
          <AlertCircle className="size-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          This page hit an unexpected error. You can retry or navigate away and come back.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-2xl border px-4 py-3 font-mono text-xs text-red-600">
          {error.message || 'Unknown error'}
        </p>
        <Button type="button" onClick={reset} className="gap-2">
          <RotateCcw className="size-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}