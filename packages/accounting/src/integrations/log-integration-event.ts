import type { Prisma } from '@prototype/db';

import { getAccountingPrisma } from '../db';

type IntegrationLogType = 'api_call' | 'webhook' | 'error' | 'sync' | 'other';
type IntegrationLogStatus = 'success' | 'failed' | 'warning';

const SECRET_KEYS = ['password', 'apiKey', 'apiSecret', 'webhookSecret'] as const;

function sanitizePayload(payload: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | undefined {
  if (!payload) return undefined;
  const out: Record<string, unknown> = { ...payload };
  for (const key of SECRET_KEYS) {
    if (key in out && out[key] !== undefined && out[key] !== null && String(out[key]).length > 0) {
      out[key] = '[redacted]';
    }
  }
  return out as Prisma.InputJsonValue;
}

export async function logIntegrationEvent(args: {
  provider: string;
  logType: IntegrationLogType;
  status: IntegrationLogStatus;
  endpoint?: string | null;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
  errorMessage?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  const prisma = getAccountingPrisma();
  const integration = await prisma.integration.findFirst({
    where: {
      provider: args.provider,
      status: 'active',
    },
    orderBy: [{ updatedAt: 'desc' }],
    select: { id: true },
  });

  if (!integration) return;

  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      logType: args.logType,
      status: args.status,
      endpoint: args.endpoint ?? null,
      requestPayload: sanitizePayload(args.requestPayload),
      responsePayload: sanitizePayload(args.responsePayload),
      errorMessage: args.errorMessage ?? null,
      durationMs: args.durationMs ?? null,
    },
  });
}