import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError } from '@/src/lib/accounting/api-helpers';
import { canReadSettings } from '@/src/lib/user-roles/permissions';
import { listSettings, maskSettingRow } from '@/src/lib/settings/settings-service';

export async function GET(request: Request) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canReadSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings read permission required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module')?.trim() || undefined;

    const settings = await listSettings(module);
    return NextResponse.json({
      settings: settings.map(maskSettingRow),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
