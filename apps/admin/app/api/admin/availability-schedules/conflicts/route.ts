import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { findScheduleConflicts } from '@/src/lib/scheduling/availability-schedules';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const conflicts = await findScheduleConflicts(body);
    return NextResponse.json({ conflicts });
  } catch (error) {
    return handleRouteError(error);
  }
}
