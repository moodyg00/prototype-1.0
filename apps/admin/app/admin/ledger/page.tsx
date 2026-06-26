import {
  listAccountsForPicker,
  listGlobalLedger,
} from '@/src/lib/accounting/journal-entries';
import { GlobalLedgerWorkspace } from '@/src/components/admin/ledger/GlobalLedgerWorkspace';
import { defaultLedgerDateRange } from '@/src/components/admin/ledger/ledger-default-range';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { from, to } = defaultLedgerDateRange();
  const [accounts, ledger] = await Promise.all([
    listAccountsForPicker(),
    listGlobalLedger({
      status: 'Posted',
      limit: 100,
      from,
      to,
      accountId: null,
      sourceModule: null,
      q: null,
      cursor: null,
    }),
  ]);

  return (
    <GlobalLedgerWorkspace
      accounts={accounts}
      initialLines={ledger.items}
      initialNextCursor={ledger.nextCursor}
    />
  );
}
