import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { canReadSettings, canWriteSettings } from '@/src/lib/user-roles/permissions';
import {
  deleteSetting,
  getSetting,
  maskSettingRow,
  upsertSetting,
} from '@/src/lib/settings/settings-service';

type RouteContext = { params: Promise<{ module: string; key: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canReadSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings read permission required.' }, { status: 403 });
    }

    const { module, key } = await context.params;
    const setting = await getSetting(module, key);
    if (!setting) {
      return NextResponse.json({ error: 'Setting not found.' }, { status: 404 });
    }

    return NextResponse.json({ setting: maskSettingRow(setting) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canWriteSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings write permission required.' }, { status: 403 });
    }

    const { module, key } = await context.params;
    const body = await readJsonBody<{ value?: unknown; description?: string | null }>(request);

    const setting = await upsertSetting({
      module,
      key,
      value: body.value,
      description: body.description,
      userId: actingUser.id,
      preserveSecrets: true,
    });

    return NextResponse.json({ setting: maskSettingRow(setting) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canWriteSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings write permission required.' }, { status: 403 });
    }

    const { module, key } = await context.params;
    await deleteSetting(module, key, actingUser.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
