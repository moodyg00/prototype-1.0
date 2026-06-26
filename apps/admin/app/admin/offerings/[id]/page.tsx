import { notFound } from 'next/navigation';
import * as React from 'react';

import { OfferingEditClient } from '@/src/components/admin/offerings/OfferingEditClient';
import { getServiceDetail } from '@/src/lib/operations/service-service';
import { isUuidShape } from '@/src/lib/uuid-shape';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();
  const service = await getServiceDetail(id);
  if (!service) notFound();
  return <OfferingEditClient service={service} />;
}
