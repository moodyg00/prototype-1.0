import React from 'react';
import { RecordIndexPage } from '@/src/components/admin/RecordIndexPage';
import { ESTIMATES_CONFIG } from '@/src/components/admin/record-index-config';

export default function Page() {
  return <RecordIndexPage config={ESTIMATES_CONFIG} />;
}
