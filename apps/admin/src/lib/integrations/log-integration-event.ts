import type { Prisma } from '@prototype/db';

import { maskPayloadObject } from '@/src/lib/observability/mask-payload';
import { prisma } from '@/src/lib/prisma';

type IntegrationLogType = 'api_call' | 'webhook' | 'error' | 'sync' | 'other';
type IntegrationLogStatus = 'success' | 'failed' | 'warning';

function sanitizePayload(payload: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | undefined {
  if (!payload) return undefined;
  return maskPayloadObject(payload) as Prisma.InputJsonValue;
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
