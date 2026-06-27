import { notFound } from 'next/navigation';
import * as React from 'react';

import { RecordCreatePage } from '@/src/components/admin/RecordCreatePage';
import {
  getAdminCreateDefinition,
  isAdminCreateSection,
  type AdminCreateSection,
} from '@/src/lib/admin-record-form-config';

export function AdminSectionCreatePage({ section }: { section: AdminCreateSection }): React.ReactElement {
  if (!isAdminCreateSection(section)) {
    notFound();
  }

  const definition = getAdminCreateDefinition(section);
  if (!definition) {
    notFound();
  }

  return (
    <RecordCreatePage backHref={`/admin/${section}`} definition={definition} section={section} />
  );
}