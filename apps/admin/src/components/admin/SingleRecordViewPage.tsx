'use client';

import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { RecordField } from '@/src/components/admin/RecordField';
import { RecordPanel, RecordView } from '@/src/components/admin/RecordView';

type FlatField = {
  path: string;
  value: string;
};

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function flattenFields(value: unknown, prefix = ''): FlatField[] {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [{ path: prefix || 'value', value: '[]' }];
    }

    return value.flatMap((entry, index) => flattenFields(entry, `${prefix}[${index}]`));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return [{ path: prefix || 'value', value: '{}' }];
    }

    return entries.flatMap(([key, entry]) => {
      const nextPath = prefix ? `${prefix}.${key}` : key;
      return flattenFields(entry, nextPath);
    });
  }

  return [{ path: prefix || 'value', value: formatPrimitive(value) }];
}

export function SingleRecordViewPage({
  sectionTitle,
  recordTitle,
  recordId,
  record,
  backHref,
}: {
  sectionTitle: string;
  recordTitle: string;
  recordId: string;
  record: Record<string, unknown>;
  backHref: string;
}) {
  const fields = React.useMemo(() => flattenFields(record), [record]);

  return (
    <RecordView
      title={recordTitle}
      subtitle={`Record ID: ${recordId}`}
      badge={
        <Badge variant="outline" className="uppercase tracking-[0.22em]">
          {sectionTitle}
        </Badge>
      }
      backHref={backHref}
    >
      <RecordPanel
        title="Record Details"
        description="Read-only snapshot. Use the dedicated editor for this record type when available."
      >
        <div className="space-y-2">
          {fields.map((field) => (
            <RecordField key={field.path} label={field.path} value={field.value} readOnly />
          ))}
        </div>
      </RecordPanel>
    </RecordView>
  );
}
