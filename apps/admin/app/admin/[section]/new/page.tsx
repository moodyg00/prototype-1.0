import { notFound } from 'next/navigation';

import { RecordCreatePage } from '@/src/components/admin/RecordCreatePage';
import { getAdminCreateDefinition, isAdminCreateSection } from '@/src/lib/admin-record-form-config';

type PageParams = {
  section: string;
};

export default async function Page({ params }: { params: Promise<PageParams> }) {
  const { section } = await params;

  if (!isAdminCreateSection(section)) {
    notFound();
  }

  const definition = getAdminCreateDefinition(section);
  if (!definition) {
    notFound();
  }

  return <RecordCreatePage backHref={`/admin/${section}`} definition={definition} section={section} />;
}
