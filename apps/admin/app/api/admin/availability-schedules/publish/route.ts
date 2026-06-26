import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { publishAvailabilitySchedule } from '@/src/lib/scheduling/availability-schedules';

export async function POST(request: Request) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    const body = await readJsonBody(request);
    const result = await publishAvailabilitySchedule(actingUser, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
