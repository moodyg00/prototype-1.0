import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { patchAvailabilityScheduleExceptions } from '@/src/lib/scheduling/availability-schedules';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    const { id } = await context.params;
    const body = await readJsonBody(request);
    const result = await patchAvailabilityScheduleExceptions(actingUser, id, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
