'use client';

import { Search } from 'lucide-react';
import {
  Combobox,
  ComboboxInput,
} from '@/components/ui/combobox';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';

// @mock-start
const MOCK_QUERY = 'jane';
const MOCK_LOADING_LABEL = 'Searching directory…';
// @mock-end

export interface SelectAsyncLoadingProps {
  query?: string;
  loadingLabel?: string;
}

export function SelectAsyncLoading({
  query = MOCK_QUERY,
  loadingLabel = MOCK_LOADING_LABEL,
}: SelectAsyncLoadingProps = {}) {
  return (
    <div className="grid gap-8 px-8 py-10 md:grid-cols-2">
      <Field>
        <FieldLabel>Search teammates</FieldLabel>
        <Combobox items={[]}>
          <ComboboxInput
            placeholder="Type to search the directory…"
            startAddon={<Search />}
          />
        </Combobox>
        <FieldDescription>
          Async-loading select — issues a network request as the user types.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          Loading state preview
        </div>
        <div
          className="relative flex flex-col rounded-lg border bg-popover not-dark:bg-clip-padding shadow-lg/5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 border-b px-3 py-2 text-sm"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted-foreground)',
            }}
          >
            <Search className="size-4" />
            <span>{query}</span>
            <span
              className="ms-auto inline-flex h-2 w-2 animate-pulse rounded-full"
              style={{ background: 'var(--primary)' }}
            />
          </div>
          <div className="flex flex-col gap-2 p-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 rounded" style={{ width: `${60 + i * 8}%` }} />
                  <Skeleton className="h-3 rounded" style={{ width: `${30 + i * 6}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div
            className="border-t px-3 py-2 text-xs"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted-foreground)',
            }}
          >
            {loadingLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
