'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type Props = {
  entryId: string;
  entryNumber: string;
  status: 'Draft' | 'Posted' | 'Reversed';
  reversedById: string | null;
};

export function JournalEntryDetailActions({
  entryId,
  entryNumber,
  status,
  reversedById,
}: Props): React.ReactElement | null {
  const router = useRouter();
  const [pending, setPending] = React.useState<'post' | 'reverse' | 'delete' | null>(null);

  const run = React.useCallback(
    async (action: 'post' | 'reverse' | 'delete', request: () => Promise<Response>, successMsg: string) => {
      setPending(action);
      try {
        const response = await request();
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? `Failed to ${action} entry.`);
        }
        toast.success(successMsg);
        if (action === 'delete') {
          router.push('/admin/journal-entries');
          router.refresh();
          return;
        }
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to ${action} entry.`);
      } finally {
        setPending(null);
      }
    },
    [router],
  );

  if (status === 'Draft') {
    return (
      <div className="flex gap-2">
        <Button
          variant="default"
          size="sm"
          disabled={pending !== null}
          onClick={() =>
            run(
              'post',
              () => fetch(`/api/admin/journal-entries/${entryId}/post`, { method: 'POST' }),
              `Posted ${entryNumber}`,
            )
          }
        >
          {pending === 'post' ? 'Posting…' : 'Post entry'}
        </Button>
        <Button
          variant="destructive-outline"
          size="sm"
          disabled={pending !== null}
          onClick={() => {
            if (!window.confirm('Delete this draft journal entry?')) return;
            void run(
              'delete',
              () => fetch(`/api/admin/journal-entries/${entryId}`, { method: 'DELETE' }),
              'Draft deleted',
            );
          }}
        >
          {pending === 'delete' ? 'Deleting…' : 'Delete draft'}
        </Button>
      </div>
    );
  }

  if (status === 'Posted' && !reversedById) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending !== null}
        onClick={() => {
          if (!window.confirm(`Reverse ${entryNumber}? A new Posted reversing entry will be created.`)) {
            return;
          }
          void run(
            'reverse',
            () => fetch(`/api/admin/journal-entries/${entryId}/reverse`, { method: 'POST' }),
            `Reversed ${entryNumber}`,
          );
        }}
      >
        {pending === 'reverse' ? 'Reversing…' : 'Reverse entry'}
      </Button>
    );
  }

  return null;
}
