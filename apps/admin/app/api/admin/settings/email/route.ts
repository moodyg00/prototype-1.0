/**
 * Email provider settings API.
 *
 *   GET  /api/admin/settings/email — current provider config, secrets MASKED.
 *   PUT  /api/admin/settings/email — upsert the config. Incoming secrets that
 *        equal the mask (or are empty) are treated as "unchanged" and the stored
 *        secret is preserved.
 *
 * The config lives in the generic `settings` store as a single JSONB row keyed
 * by the `module_key` unique constraint (module="email", key="provider"), with
 * `isSensitive = true` so the UI/API knows it carries secrets.
 */
import { NextResponse } from 'next/server';

import { Prisma } from '@prototype/db';
import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import {
  EMAIL_SETTING_KEY,
  EMAIL_SETTING_MODULE,
  SECRET_CREDENTIAL_KEYS,
  SECRET_MASK,
  emailProviderConfigSchema,
  getEmailProviderConfig,
  type EmailCredentials,
  type EmailProviderConfig,
} from '@/src/lib/email/provider';

/** Replace any set secret with the mask; leave unset secrets as empty strings. */
function maskConfig(config: EmailProviderConfig): EmailProviderConfig {
  const credentials: EmailCredentials = { ...config.credentials };
  for (const key of SECRET_CREDENTIAL_KEYS) {
    const current = credentials[key];
    credentials[key] = current && String(current).length > 0 ? SECRET_MASK : '';
  }
  return { ...config, credentials };
}

export async function GET() {
  try {
    const config = await getEmailProviderConfig();
    return NextResponse.json({ config: maskConfig(config) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const incoming = emailProviderConfigSchema.parse(body);

    const existing = await getEmailProviderConfig();

    // Merge secrets: preserve the stored value when the incoming value is blank
    // or still the mask (i.e. the user didn't type a new secret).
    const credentials: EmailCredentials = { ...incoming.credentials };
    for (const key of SECRET_CREDENTIAL_KEYS) {
      const next = credentials[key];
      if (next === undefined || next === '' || next === SECRET_MASK) {
        credentials[key] = existing.credentials[key];
      }
    }

    const merged: EmailProviderConfig = {
      provider: incoming.provider,
      fromName: incoming.fromName,
      fromEmail: incoming.fromEmail,
      replyTo: incoming.replyTo,
      credentials,
    };

    await prisma.setting.upsert({
      where: { module_key: { module: EMAIL_SETTING_MODULE, key: EMAIL_SETTING_KEY } },
      create: {
        module: EMAIL_SETTING_MODULE,
        key: EMAIL_SETTING_KEY,
        value: merged as unknown as Prisma.InputJsonValue,
        description: 'Email provider configuration (sender identity + credentials).',
        isSensitive: true,
      },
      update: {
        value: merged as unknown as Prisma.InputJsonValue,
        isSensitive: true,
      },
    });

    return NextResponse.json({ config: maskConfig(merged) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
