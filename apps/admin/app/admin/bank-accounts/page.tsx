'use client';

import React, { useCallback, useState } from 'react';
import { RecordIndexPage } from '@/src/components/admin/RecordIndexPage';
import { BANK_ACCOUNTS_CONFIG } from '@/src/components/admin/record-index-config';
import { BankSyncButton } from '@/src/components/admin/banking/BankSyncButton';

export default function BankAccountsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSynced = useCallback(async () => {
    setRefreshKey((value) => value + 1);
  }, []);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
        Bank accounts are synced from Mercury and cannot be added or edited here.
      </p>
      <div className="flex justify-end">
        <BankSyncButton onSynced={handleSynced} />
      </div>
      <RecordIndexPage key={refreshKey} config={BANK_ACCOUNTS_CONFIG} />
    </div>
  );
}
