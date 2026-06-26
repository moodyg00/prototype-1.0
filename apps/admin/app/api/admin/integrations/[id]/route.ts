import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { maskSecret } from '@/src/lib/integrations/credentials';
import { prisma } from '@/src/lib/prisma';
import { apiIntegrationUpdateSchema } from '@/src/lib/validation/api-integrations';

type RouteParams = { params: Promise<{ id: string }> };

const INTEGRATION_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  provider: true,
  environment: true,
  baseUrl: true,
  authType: true,
  apiKey: true,
  apiSecret: true,
  webhookSecret: true,
  publicKey: true,
  externalAccountId: true,
  docsUrl: true,
  lastConnectedAt: true,
} as const;

function serializeIntegrationDetail(row: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  provider: string | null;
  environment: string | null;
  baseUrl: string | null;
  authType: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  webhookSecret: string | null;
  publicKey: string | null;
  externalAccountId: string | null;
  docsUrl: string | null;
  lastConnectedAt: Date | null;
}) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    provider: row.provider,
    environment: row.environment,
    baseUrl: row.baseUrl,
    authType: row.authType,
    apiKey: row.apiKey ?? '',
    apiSecret: row.apiSecret ?? '',
    webhookSecret: row.webhookSecret ?? '',
    publicKey: row.publicKey ?? '',
    externalAccountId: row.externalAccountId,
    docsUrl: row.docsUrl,
    maskedApiKey: maskSecret(row.apiKey),
    lastConnectedAt: row.lastConnectedAt?.toISOString() ?? null,
  };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findFirst({
      where: { id, type: 'api' },
      select: INTEGRATION_SELECT,
    });
    if (!integration) return jsonError(404, 'Integration not found.');
    return NextResponse.json({ integration: serializeIntegrationDetail(integration) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = apiIntegrationUpdateSchema.parse(body);
    const integration = await prisma.integration.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description ?? null } : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.provider !== undefined ? { provider: parsed.provider ?? null } : {}),
        ...(parsed.environment !== undefined ? { environment: parsed.environment ?? null } : {}),
        ...(parsed.baseUrl !== undefined ? { baseUrl: parsed.baseUrl?.trim() || null } : {}),
        ...(parsed.authType !== undefined ? { authType: parsed.authType ?? null } : {}),
        ...(parsed.apiKey?.trim() ? { apiKey: parsed.apiKey.trim() } : {}),
        ...(parsed.apiSecret?.trim() ? { apiSecret: parsed.apiSecret.trim() } : {}),
        ...(parsed.webhookSecret?.trim() ? { webhookSecret: parsed.webhookSecret.trim() } : {}),
        ...(parsed.publicKey !== undefined ? { publicKey: parsed.publicKey?.trim() || null } : {}),
        ...(parsed.externalAccountId !== undefined
          ? { externalAccountId: parsed.externalAccountId?.trim() || null }
          : {}),
        ...(parsed.docsUrl !== undefined ? { docsUrl: parsed.docsUrl?.trim() || null } : {}),
      },
      select: INTEGRATION_SELECT,
    });

    return NextResponse.json({ integration: serializeIntegrationDetail(integration) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.integration.findFirst({
      where: { id, type: 'api' },
      select: { name: true },
    });
    if (!existing) return jsonError(404, 'Integration not found.');

    await prisma.integration.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
