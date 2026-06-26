import { notFound } from 'next/navigation';
import * as React from 'react';

import { AttachmentPanel } from '@/src/components/admin/attachments/AttachmentPanel';
import { SingleRecordViewPage } from '@/src/components/admin/SingleRecordViewPage';
import { LEADS_CONFIG } from '@/src/components/admin/record-index-config';
import { listLeadAttachments } from '@/src/lib/attachments/attachment-service';
import { getAdminRecordDetail } from '@/src/lib/admin-record-operations';
import { isUuidShape } from '@/src/lib/uuid-shape';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  if (!isUuidShape(id)) notFound();

  const [detail, attachments] = await Promise.all([
    getAdminRecordDetail('leads', id),
    listLeadAttachments(id),
  ]);
  if (!detail) notFound();

  return (
    <div className="space-y-6 pb-10">
      <SingleRecordViewPage
        sectionTitle={LEADS_CONFIG.title}
        recordTitle={detail.title}
        recordId={id}
        record={detail.record}
        backHref="/admin/leads"
      />

      <AttachmentPanel
        title="Photos"
        description="Images attached to this lead. Inherited by any work order created from it."
        scope="lead"
        leadId={id}
        initialAttachments={attachments}
        allowPhotos
      />
    </div>
  );
}
