import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { listAvailabilitySubjects } from '@/src/lib/scheduling/availability-schedules';
import { ensureDefaultUserRoles } from '@/src/lib/user-roles/user-roles';

export async function GET() {
  try {
    await ensureDefaultUserRoles();
    const actingUser = await resolveActingUser();
    const subjects = await listAvailabilitySubjects();
    return NextResponse.json({ subjects, actingUser });
  } catch (error) {
    return handleRouteError(error);
  }
}
