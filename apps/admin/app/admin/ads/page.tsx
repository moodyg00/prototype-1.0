import React from 'react';
import { RecordIndexPage } from '@/src/components/admin/RecordIndexPage';
import { ADS_CONFIG } from '@/src/components/admin/record-index-config';

export default function Page() {
  return <RecordIndexPage config={ADS_CONFIG} />;
}
