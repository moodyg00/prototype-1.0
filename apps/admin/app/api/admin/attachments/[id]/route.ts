import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { deleteAttachment } from '@/src/lib/attachments/attachment-service';
import { isUuidShape } from '@/src/lib/uuid-shape';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isUuidShape(id)) {
      return NextResponse.json({ error: 'Invalid attachment id.' }, { status: 400 });
    }
    await deleteAttachment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
