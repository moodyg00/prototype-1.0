import { NextResponse } from 'next/server';
import { IDE_MODEL_OPTIONS } from '@prototype/ide-tools';

import { isIdeProviderConfigured } from '../../../../lib/integrations/ide-llm';

export const runtime = 'nodejs';

/** Lists IDE agent models and whether each provider has an API key configured. */
export async function GET() {
  const configured = await Promise.all(
    IDE_MODEL_OPTIONS.map(async (m) => ({
      ...m,
      configured: await isIdeProviderConfigured(m.provider),
    })),
  );
  return NextResponse.json({ models: configured });
}
