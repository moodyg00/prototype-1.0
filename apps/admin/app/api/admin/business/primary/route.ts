import { NextResponse } from 'next/server';

import { resolveActingUser } from '@/src/lib/acting-user';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { canReadSettings, canWriteSettings } from '@/src/lib/user-roles/permissions';
import {
  getOrCreatePrimaryBusiness,
  updatePrimaryBusiness,
} from '@/src/lib/business/primary-business';
import { getSystemSettingsBundle } from '@/src/lib/settings/settings-service';

export async function GET() {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canReadSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings read permission required.' }, { status: 403 });
    }

    const [business, system] = await Promise.all([
      getOrCreatePrimaryBusiness(actingUser.id),
      getSystemSettingsBundle(true),
    ]);

    return NextResponse.json({
      business,
      appUrl: system.app.url,
      cronSecret: system.cron.secret,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actingUser = await resolveActingUser();
    if (!actingUser) {
      return NextResponse.json({ error: 'No acting user available.' }, { status: 401 });
    }
    if (!canWriteSettings(actingUser)) {
      return NextResponse.json({ error: 'Settings write permission required.' }, { status: 403 });
    }

    const body = await readJsonBody<{
      business?: unknown;
      appUrl?: string;
      cronSecret?: string;
    }>(request);

    const business = body.business
      ? await updatePrimaryBusiness(body.business, actingUser.id)
      : await getOrCreatePrimaryBusiness(actingUser.id);

    const { upsertSetting } = await import('@/src/lib/settings/settings-service');

    let appUrl = body.appUrl;
    if (appUrl !== undefined) {
      await upsertSetting({
        module: 'system',
        key: 'app',
        value: { url: appUrl },
        userId: actingUser.id,
      });
    }

    let cronSecret = body.cronSecret;
    if (cronSecret !== undefined) {
      await upsertSetting({
        module: 'system',
        key: 'cron',
        value: { secret: cronSecret },
        userId: actingUser.id,
        preserveSecrets: true,
      });
    }

    const system = await getSystemSettingsBundle(true);
    if (appUrl === undefined) appUrl = system.app.url;
    if (cronSecret === undefined) cronSecret = system.cron.secret;

    return NextResponse.json({ business, appUrl, cronSecret });
  } catch (error) {
    return handleRouteError(error);
  }
}
