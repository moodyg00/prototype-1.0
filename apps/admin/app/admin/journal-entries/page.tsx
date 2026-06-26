import {
  listAccountsForPicker,
  listJournalEntries,
  previewNextEntryNumber,
} from '@/src/lib/accounting/journal-entries';
import { JournalEntryWorkspace } from '@/src/components/admin/journal-entries/JournalEntryWorkspace';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [accounts, entries, nextNumber] = await Promise.all([
    listAccountsForPicker(),
    listJournalEntries({ status: 'all', limit: 50, q: null, cursor: null }),
    previewNextEntryNumber(),
  ]);

  return (
    <JournalEntryWorkspace
      accounts={accounts}
      initialEntries={entries.items}
      initialNextNumber={nextNumber}
    />
  );
}
