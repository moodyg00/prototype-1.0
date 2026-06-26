import React from 'react';
import { RecordIndexPage } from '@/src/components/admin/RecordIndexPage';
import { CATALOG_CONFIG } from '@/src/components/admin/record-index-config';

export default function Page() {
  return <RecordIndexPage config={CATALOG_CONFIG} />;
}
