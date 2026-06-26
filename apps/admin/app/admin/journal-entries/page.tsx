import {
  listAccountsForPicker,
  listJournalEntries,
} from '@/src/lib/accounting/journal-entries';
import { JournalEntryWorkspace } from '@/src/components/admin/journal-entries/JournalEntryWorkspace';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [accounts, entries] = await Promise.all([
    listAccountsForPicker(),
    listJournalEntries({ status: 'all', limit: 50, q: null, cursor: null }),
  ]);

  return (
    <JournalEntryWorkspace
      accounts={accounts}
      initialEntries={entries.items}
    />
  );
}
