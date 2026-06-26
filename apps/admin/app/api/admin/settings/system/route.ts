import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { canReadSettings, canWriteSettings } from '@/src/lib/user-roles/permissions';
import {
  getSystemSettingsBundle,
  upsertSystemSettingsBundle,
} from '@/src/lib/settings/settings-service';
import { cronSecretSettingSchema, appUrlSettingSchema } from '@/src/lib/settings/registry';
import { z } from 'zod';

const systemSettingsBodySchema = z.object({
  app: appUrlSettingSchema,
  cron: cronSecretSettingSchema,
});

export async function GET() {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canReadSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings read permission required.' }, { status: 403 });
    }

    const settings = await getSystemSettingsBundle(true);
    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canWriteSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings write permission required.' }, { status: 403 });
    }

    const body = await readJsonBody(request);
    const incoming = systemSettingsBodySchema.parse(body);
    const settings = await upsertSystemSettingsBundle(incoming, actingUser.id);
    return NextResponse.json({ settings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
