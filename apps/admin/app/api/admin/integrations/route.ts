import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { maskSecret } from '@/src/lib/integrations/credentials';
import { prisma } from '@/src/lib/prisma';
import { apiIntegrationCreateSchema } from '@/src/lib/validation/api-integrations';

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
  createdAt: true,
  updatedAt: true,
} as const;

function serializeIntegration(row: {
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
  createdAt?: Date | null;
  updatedAt?: Date | null;
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
    maskedApiKey: maskSecret(row.apiKey),
    maskedApiSecret: maskSecret(row.apiSecret),
    maskedWebhookSecret: maskSecret(row.webhookSecret),
    publicKey: row.publicKey,
    externalAccountId: row.externalAccountId,
    docsUrl: row.docsUrl,
    lastConnectedAt: row.lastConnectedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

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
    ...serializeIntegration(row),
    apiKey: row.apiKey ?? '',
    apiSecret: row.apiSecret ?? '',
    webhookSecret: row.webhookSecret ?? '',
  };
}

function integrationDataFromParsed(parsed: ReturnType<typeof apiIntegrationCreateSchema.parse>) {
  return {
    name: parsed.name,
    type: 'api' as const,
    description: parsed.description ?? null,
    status: parsed.status ?? 'active',
    provider: parsed.provider ?? null,
    environment: parsed.environment ?? 'production',
    baseUrl: parsed.baseUrl?.trim() || null,
    authType: parsed.authType ?? 'api_key',
    apiKey: parsed.apiKey?.trim() || null,
    apiSecret: parsed.apiSecret?.trim() || null,
    webhookSecret: parsed.webhookSecret?.trim() || null,
    publicKey: parsed.publicKey?.trim() || null,
    externalAccountId: parsed.externalAccountId?.trim() || null,
    docsUrl: parsed.docsUrl?.trim() || null,
  };
}

export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      where: { type: 'api' },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: INTEGRATION_SELECT,
    });
    return NextResponse.json({
      integrations: integrations.map(serializeIntegration),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = apiIntegrationCreateSchema.parse(body);
    const integration = await prisma.integration.create({
      data: integrationDataFromParsed(parsed),
      select: INTEGRATION_SELECT,
    });

    return NextResponse.json(
      { integration: serializeIntegrationDetail(integration) },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
