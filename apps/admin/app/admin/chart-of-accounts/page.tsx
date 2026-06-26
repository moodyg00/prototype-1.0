import React from 'react';
import { RecordIndexPage } from '@/src/components/admin/RecordIndexPage';
import { CHART_OF_ACCOUNTS_CONFIG } from '@/src/components/admin/record-index-config';

export default function Page() {
  return <RecordIndexPage config={CHART_OF_ACCOUNTS_CONFIG} />;
}
