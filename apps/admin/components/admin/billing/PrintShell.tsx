'use client';

import * as React from 'react';

import { cn } from '@/src/lib/utils';

export interface PrintShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Forward-ref wrapper around the printable preview surface. Future PDF /
 * print integrations can hand the ref to `react-to-print` (or similar) so the
 * preview can be exported as-is without rendering the surrounding chrome.
 */
export const PrintShell = React.forwardRef<HTMLDivElement, PrintShellProps>(
  function PrintShell({ children, className }, ref): React.ReactElement {
    return (
      <div
        ref={ref}
        className={cn(
          'billing-print-shell overflow-hidden rounded-lg border shadow-sm',
          className,
        )}
        style={{
          backgroundColor: '#ffffff',
          color: '#171717',
          borderColor: '#e5e5e5',
          colorScheme: 'light',
        }}
        data-print-surface
      >
        {children}
      </div>
    );
  },
);
