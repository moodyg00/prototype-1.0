'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

export function BankTransactionIgnoreButton({
  transactionId,
  ignored,
  size = 'sm',
  variant = 'secondary',
  onChanged,
}: {
  transactionId: string;
  ignored: boolean;
  size?: 'sm' | 'xs' | 'default';
  variant?: 'secondary' | 'outline' | 'destructive';
  onChanged?: () => void | Promise<void>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleIgnore() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bank-transactions/${transactionId}/ignore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ignore: !ignored }),
      });
      const body = (await response.json()) as { error?: string; ignored?: boolean };
      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to update ignore status.');
      }
      toast.success(body.ignored ? 'Transaction ignored.' : 'Transaction restored.');
      await onChanged?.();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update ignore status.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      variant={ignored ? 'outline' : variant}
      loading={loading}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void toggleIgnore();
      }}
    >
      {ignored ? 'Restore' : 'Ignore'}
    </Button>
  );
}
