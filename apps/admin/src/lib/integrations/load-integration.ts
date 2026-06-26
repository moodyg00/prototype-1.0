import { prisma } from '@/src/lib/prisma';

export type LoadedApiIntegration = {
  id: string;
  name: string;
  provider: string;
  environment: string | null;
  baseUrl: string | null;
  authType: string | null;
  apiKey: string | null;
  apiSecret: string | null;
  webhookSecret: string | null;
  publicKey: string | null;
  externalAccountId: string | null;
  docsUrl: string | null;
};

const INTEGRATION_SELECT = {
  id: true,
  name: true,
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
} as const;

export async function getActiveApiIntegration(
  provider: string,
): Promise<LoadedApiIntegration | null> {
  const row = await prisma.integration.findFirst({
    where: {
      type: 'api',
      provider,
      status: 'active',
    },
    orderBy: [{ updatedAt: 'desc' }],
    select: INTEGRATION_SELECT,
  });
  return row;
}

export async function requireActiveApiIntegration(provider: string): Promise<LoadedApiIntegration> {
  const row = await getActiveApiIntegration(provider);
  if (!row) {
    throw new Error(
      `No active ${provider} API integration is configured. Add it under Admin → API integrations.`,
    );
  }
  return row;
}

export async function requireApiKey(provider: string, label = 'API key'): Promise<string> {
  const integration = await requireActiveApiIntegration(provider);
  const key = integration.apiKey?.trim();
  if (!key) {
    throw new Error(
      `${label} is missing for the ${provider} integration. Set it under Admin → API integrations.`,
    );
  }
  return key;
}
