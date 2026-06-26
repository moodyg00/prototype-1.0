import { notFound } from 'next/navigation';

import { RecordView } from '@/src/components/admin/RecordView';
import { JournalEntryEditClient } from '@/src/components/admin/journal-entries/JournalEntryEditClient';
import {
  getJournalEntryDetail,
  listAccountsForPicker,
} from '@/src/lib/accounting/journal-entries';

export const dynamic = 'force-dynamic';

type PageParams = { id: string };

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { id } = await params;
  const [entry, accounts] = await Promise.all([
    getJournalEntryDetail(id),
    listAccountsForPicker(),
  ]);
  if (!entry) notFound();

  return (
    <RecordView
      title={entry.entryNumber}
      subtitle={`Entry date: ${entry.entryDate}`}
      backHref="/admin/journal-entries"
    >
      <JournalEntryEditClient entry={entry} accounts={accounts} />
    </RecordView>
  );
}
