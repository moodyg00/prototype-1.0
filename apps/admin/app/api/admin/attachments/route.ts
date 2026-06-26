import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import {
  createAttachmentFromUpload,
  listAttachments,
} from '@/src/lib/attachments/attachment-service';
import {
  attachmentListQuerySchema,
  attachmentUploadSchema,
} from '@/src/lib/validation/attachment';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = attachmentListQuerySchema.parse({
      scope: searchParams.get('scope') ?? undefined,
      leadId: searchParams.get('leadId') ?? undefined,
      workOrderId: searchParams.get('workOrderId') ?? undefined,
      kind: searchParams.get('kind') ?? undefined,
    });
    const attachments = await listAttachments(query);
    return NextResponse.json({ attachments });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'A file is required.' }, { status: 400 });
    }

    const input = attachmentUploadSchema.parse({
      kind: formData.get('kind') ?? undefined,
      scope: formData.get('scope') ?? undefined,
      leadId: formData.get('leadId') || undefined,
      workOrderId: formData.get('workOrderId') || undefined,
      description: formData.get('description') || undefined,
    });

    const attachment = await createAttachmentFromUpload({ file, input });
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
