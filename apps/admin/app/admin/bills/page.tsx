import React from 'react';

import { RecordIndexPage, type RecordIndexConfig } from '@/src/components/admin/RecordIndexPage';

const BILLS_CONFIG: RecordIndexConfig = {
  eyebrow: 'Accounting',
  title: 'Bills',
  description: 'Vendor bills sourced from the database.',
  searchPlaceholder: 'Search bills, vendors, and statuses',
  filterLabel: 'Status',
  emptyMessage: 'No records',
  filterOptions: [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'received', label: 'Received' },
    { value: 'approved', label: 'Approved' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  gridClassName: 'grid gap-4 md:grid-cols-2 xl:grid-cols-3',
  records: [],
};

export default function BillsPage() {
  return <RecordIndexPage config={BILLS_CONFIG} />;
}
