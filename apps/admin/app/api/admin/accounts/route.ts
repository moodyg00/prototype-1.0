import { NextResponse } from 'next/server';

import { listAccountsForPicker } from '@/src/lib/accounting/journal-entries';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';

export async function GET() {
  try {
    const accounts = await listAccountsForPicker();
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleRouteError(error);
  }
}
