import { NextResponse } from 'next/server';

import { previewNextEntryNumber } from '@/src/lib/accounting/journal-entries';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

export async function GET() {
  try {
    const entryNumber = await previewNextEntryNumber();
    return NextResponse.json({ entryNumber });
  } catch (error) {
    return handleRouteError(error);
  }
}
