import { prisma } from '../prisma';

/**
 * Resolve the xAI (Grok) API key for workflow LLM/agent nodes.
 *
 * Priority:
 *   1. process.env.XAI_API_KEY (recommended for local dev)
 *   2. An active xAI Integration row in the database (provider = 'xai')
 *
 * Returns null when no key is configured anywhere, so callers can surface a
 * clear "offline" message instead of throwing deep in the model call.
 */
export async function resolveXaiApiKey(): Promise<string | null> {
  const fromEnv = process.env.XAI_API_KEY?.trim();
  if (fromEnv) return fromEnv;

  try {
    if (!prisma) return null;
    const integration = await prisma.integration.findFirst({
      where: { provider: 'xai', status: 'active', apiKey: { not: null } },
      select: { apiKey: true },
    });
    const key = integration?.apiKey?.trim();
    return key || null;
  } catch (err) {
    console.warn('[xai] Integration lookup failed:', (err as Error).message);
    return null;
  }
}

export const XAI_BASE_URL = 'https://api.x.ai/v1';
