import * as React from 'react';

import { AttachmentPanel } from '@/src/components/admin/attachments/AttachmentPanel';
import { listAttachments } from '@/src/lib/attachments/attachment-service';

export const dynamic = 'force-dynamic';

export default async function UploadsPage(): Promise<React.ReactElement> {
  const attachments = await listAttachments({ scope: 'global' });

  return (
    <div className="space-y-6 pb-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Uploads</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          Upload and manage photos and general files. Records here live in the global library and
          are not tied to a specific lead or work order.
        </p>
      </header>

      <AttachmentPanel
        title="Library"
        description="Drop in photos and documents for general use."
        scope="global"
        initialAttachments={attachments}
        allowPhotos
        allowFiles
      />
    </div>
  );
}
