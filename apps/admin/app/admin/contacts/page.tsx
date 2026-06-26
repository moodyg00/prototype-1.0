'use client';

import React from 'react';
import { RecordIndexPage, type RecordItem } from '@/src/components/admin/RecordIndexPage';
import { CONTACTS_CONFIG } from '@/src/components/admin/record-index-config';
import { RecordCard } from '@/components/admin/RecordCard';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? '').join('').toUpperCase() || '–';
}

function metaValue(record: RecordItem, ...labels: string[]): string | undefined {
  const lowered = labels.map((label) => label.toLowerCase());
  return record.meta.find((item) => lowered.includes(item.label.toLowerCase()))?.value;
}

function toPerson(record: RecordItem) {
  return {
    id: record.id,
    name: record.name,
    initials: initialsFor(record.name),
    role: record.subtitle,
    email: metaValue(record, 'Email'),
    phone: metaValue(record, 'Phone', 'Preferred'),
    city: metaValue(record, 'City', 'Org', 'Organization'),
    status: record.badge ? { label: record.badge.label, variant: record.badge.variant } : undefined,
  };
}

export default function ContactsPage() {
  return (
    <RecordIndexPage
      config={CONTACTS_CONFIG}
      renderRecords={(records) => (
        <RecordCard people={records.map(toPerson)} profileBasePath="/admin/contacts" />
      )}
    />
  );
}
