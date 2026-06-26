import * as React from 'react';

import { RecordCreatePage } from '@/src/components/admin/RecordCreatePage';
import { getAdminCreateDefinition } from '@/src/lib/admin-record-form-config';

export default function Page(): React.ReactElement {
  const definition = getAdminCreateDefinition('catalog');
  if (!definition) {
    throw new Error('Catalog create definition is missing.');
  }
  return (
    <RecordCreatePage backHref="/admin/catalog" definition={definition} section="catalog" />
  );
}
