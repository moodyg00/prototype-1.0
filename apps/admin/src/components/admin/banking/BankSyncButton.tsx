'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

type SyncResponse = {
  ok?: boolean;
  accountsSynced?: number;
  cardsSynced?: number;
  transactionsSynced?: number;
  demoRowsRemoved?: number;
  error?: string;
};

export function BankSyncButton({
  onSynced,
}: {
  onSynced?: () => void | Promise<void>;
}) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/bank/sync', { method: 'POST' });
      const body = (await response.json()) as SyncResponse;
      if (!response.ok) {
        throw new Error(body.error ?? 'Mercury sync failed.');
      }
      toast.success(
        `Synced ${body.accountsSynced ?? 0} accounts, ${body.cardsSynced ?? 0} cards, and ${body.transactionsSynced ?? 0} transactions from Mercury.`,
      );
      await onSynced?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Mercury sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Button variant="secondary" onClick={() => void handleSync()} disabled={syncing}>
      <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
      {syncing ? 'Syncing…' : 'Sync Mercury'}
    </Button>
  );
}
