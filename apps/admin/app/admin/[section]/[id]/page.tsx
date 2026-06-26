import { notFound } from 'next/navigation';

import { SingleRecordViewPage } from '@/src/components/admin/SingleRecordViewPage';
import { isAdminDbSection } from '@/src/lib/admin-record-form-config';
import {
  ADS_CONFIG,
  BANK_ACCOUNTS_CONFIG,
  BANK_CARDS_CONFIG,
  CAMPAIGNS_CONFIG,
  CATALOG_CONFIG,
  CHART_OF_ACCOUNTS_CONFIG,
  CONTACTS_CONFIG,
  ESTIMATES_CONFIG,
  INVOICES_CONFIG,
  LEADS_CONFIG,
  OFFERINGS_CONFIG,
  ORGANIZATIONS_CONFIG,
  WORK_ORDERS_CONFIG,
} from '@/src/components/admin/record-index-config';

type PageParams = {
  section: string;
  id: string;
};

const SECTION_TITLES = {
  ads: ADS_CONFIG.title,
  'bank-accounts': BANK_ACCOUNTS_CONFIG.title,
  'bank-cards': BANK_CARDS_CONFIG.title,
  campaigns: CAMPAIGNS_CONFIG.title,
  catalog: CATALOG_CONFIG.title,
  'chart-of-accounts': CHART_OF_ACCOUNTS_CONFIG.title,
  contacts: CONTACTS_CONFIG.title,
  bills: 'Bills',
  estimates: ESTIMATES_CONFIG.title,
  invoices: INVOICES_CONFIG.title,
  leads: LEADS_CONFIG.title,
  offerings: OFFERINGS_CONFIG.title,
  organizations: ORGANIZATIONS_CONFIG.title,
  'work-orders': WORK_ORDERS_CONFIG.title,
} as const;

const USER_RECORDS = [
  { id: 'usr_001', name: 'Jordan Diaz', email: 'jordan@proto2.app', role: 'admin', status: 'active', lastSeen: '2m ago' },
  { id: 'usr_002', name: 'Nina Tran', email: 'nina@proto2.app', role: 'manager', status: 'active', lastSeen: '19m ago' },
  { id: 'usr_003', name: 'Sam Ortega', email: 'sam@proto2.app', role: 'operator', status: 'pending', lastSeen: 'never' },
  { id: 'usr_004', name: 'Maya Chen', email: 'maya@proto2.app', role: 'manager', status: 'active', lastSeen: '1h ago' },
  { id: 'usr_005', name: 'Alex Reid', email: 'alex@proto2.app', role: 'operator', status: 'blocked', lastSeen: '4d ago' },
] as const;

const TRANSACTION_RECORDS = [
  { id: 'tx_001', date: '2026-05-27', avatar: 'AC', name: 'Acme Corp', description: 'Invoice #4821 payment', amount: 12450, type: 'income', status: 'posted' },
  { id: 'tx_002', date: '2026-05-27', avatar: 'ST', name: 'Stripe', description: 'Payout batch May 26', amount: 8920, type: 'income', status: 'posted' },
  { id: 'tx_003', date: '2026-05-26', avatar: 'AD', name: 'Adobe', description: 'Creative Cloud subscription', amount: -5999, type: 'expense', status: 'posted' },
  { id: 'tx_004', date: '2026-05-26', avatar: 'GG', name: 'Google Ads', description: 'Campaign spend - May', amount: -1240, type: 'expense', status: 'pending' },
  { id: 'tx_005', date: '2026-05-25', avatar: 'SH', name: 'Shopify', description: 'Platform fees', amount: -450, type: 'expense', status: 'posted' },
  { id: 'tx_006', date: '2026-05-25', avatar: 'CL', name: 'Client: Vertex Labs', description: 'Retainer Q2', amount: 8500, type: 'income', status: 'reconciled' },
  { id: 'tx_007', date: '2026-05-24', avatar: 'AP', name: 'Apple', description: 'iCloud storage', amount: -99, type: 'expense', status: 'posted' },
  { id: 'tx_008', date: '2026-05-24', avatar: 'TW', name: 'Twilio', description: 'SMS & voice API', amount: -320, type: 'expense', status: 'failed' },
] as const;

const TABLE_RECORDS_BY_SECTION = {
  'bank-transactions': { title: 'Bank Transactions', records: TRANSACTION_RECORDS },
  users: { title: 'Users', records: USER_RECORDS },
} as const;

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { id, section } = await params;

  if (isAdminDbSection(section)) {
    const { getAdminRecordDetail } = await import('@/src/lib/admin-record-operations');
    const dbRecord = await getAdminRecordDetail(section, id);
    if (!dbRecord) {
      notFound();
    }
    const sectionTitle = SECTION_TITLES[section as keyof typeof SECTION_TITLES] ?? section;

    return (
      <SingleRecordViewPage
        sectionTitle={sectionTitle}
        recordTitle={dbRecord.title}
        recordId={id}
        record={dbRecord.record}
        backHref={`/admin/${section}`}
      />
    );
  }

  const tableSection = TABLE_RECORDS_BY_SECTION[section as keyof typeof TABLE_RECORDS_BY_SECTION];
  if (tableSection) {
    const record = tableSection.records.find((entry) => entry.id === id);
    if (!record) notFound();

    return (
      <SingleRecordViewPage
        sectionTitle={tableSection.title}
        recordTitle={String((record as { name?: unknown }).name ?? record.id)}
        recordId={String(record.id)}
        record={record as unknown as Record<string, unknown>}
        backHref={`/admin/${section}`}
      />
    );
  }

  notFound();
}
