import { notFound } from 'next/navigation';

import { SingleRecordViewPage } from '@/src/components/admin/SingleRecordViewPage';
import { getBankTransactionDetail } from '@/src/lib/banking/list-transactions';
import { maskSecret } from '@/src/lib/integrations/credentials';
import { isAdminDbSection } from '@/src/lib/admin-record-form-config';
import { prisma } from '@/src/lib/prisma';
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

function serializeRecord(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

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

  if (section === 'users') {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        userType: true,
        roleRef: { select: { name: true } },
        aiModel: true,
        description: true,
        apiKey: true,
        passwordHash: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        createdByRef: { select: { fullName: true, email: true } },
        updatedByRef: { select: { fullName: true, email: true } },
      },
    });
    if (!user) notFound();

    const userRecord = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      userType: user.userType,
      role: user.roleRef?.name ?? 'Unassigned',
      aiModel: user.aiModel,
      description: user.description,
      apiKey: user.apiKey ? maskSecret(user.apiKey) : null,
      isActive: user.isActive,
      invitePending: user.userType === 'human' && !user.passwordHash,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt?.toISOString() ?? null,
      updatedAt: user.updatedAt?.toISOString() ?? null,
      createdBy: user.createdByRef?.fullName ?? user.createdByRef?.email ?? null,
      updatedBy: user.updatedByRef?.fullName ?? user.updatedByRef?.email ?? null,
    };

    return (
      <SingleRecordViewPage
        sectionTitle="Users"
        recordTitle={user.fullName || user.email || user.id}
        recordId={user.id}
        record={serializeRecord(userRecord)}
        backHref="/admin/users"
      />
    );
  }

  if (section === 'bank-transactions') {
    const transaction = await getBankTransactionDetail(id);
    if (!transaction) notFound();

    return (
      <SingleRecordViewPage
        sectionTitle="Bank Transactions"
        recordTitle={transaction.name}
        recordId={transaction.id}
        record={serializeRecord(transaction)}
        backHref="/admin/bank-transactions"
      />
    );
  }

  notFound();
}
