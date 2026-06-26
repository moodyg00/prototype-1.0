import { notFound } from 'next/navigation';
import * as React from 'react';

import { WorkOrderEditClient } from '@/src/components/admin/work-orders/WorkOrderEditClient';
import { listWorkOrderAttachments } from '@/src/lib/attachments/attachment-service';
import { getWorkOrderMaterials } from '@/src/lib/operations/accept-estimate';
import { loadWorkOrderBootstrap } from '@/src/lib/operations/work-order-bootstrap';
import { getWorkOrderDetail } from '@/src/lib/operations/work-order-service';
import { isUuidShape } from '@/src/lib/uuid-shape';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();
  const [bootstrap, workOrder, materials, attachments] = await Promise.all([
    loadWorkOrderBootstrap(),
    getWorkOrderDetail(id),
    getWorkOrderMaterials(id),
    listWorkOrderAttachments(id),
  ]);
  if (!workOrder) notFound();
  return (
    <WorkOrderEditClient
      bootstrap={bootstrap}
      workOrder={workOrder}
      materials={materials}
      attachments={attachments}
    />
  );
}
