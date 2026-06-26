import { NextResponse } from 'next/server';

import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { previewNextNumber } from '@/src/lib/accounting/numbering';

export async function GET() {
  try {
    const estimateNumber = await previewNextNumber('estimate');
    return NextResponse.json({ estimateNumber });
  } catch (error) {
    return handleRouteError(error);
  }
}
