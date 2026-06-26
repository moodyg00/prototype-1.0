'use client';

import React from 'react';
import { RecordIndexPage } from '@/src/components/admin/RecordIndexPage';
import { LEADS_CONFIG } from '@/src/components/admin/record-index-config';

export default function LeadsPage() {
  return <RecordIndexPage config={LEADS_CONFIG} />;
}
