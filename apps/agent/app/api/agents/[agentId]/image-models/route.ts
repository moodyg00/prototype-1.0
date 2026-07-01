import { NextResponse } from 'next/server';

import {
  getAgentImageModelPrefs,
  setAgentImageModelPrefs,
} from '@/lib/media/image-model-prefs-store';
import { listImageModelsWithConfig } from '@/lib/integrations/image-llm';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  const prefs = await getAgentImageModelPrefs(agentId);
  const models = await listImageModelsWithConfig();
  return NextResponse.json({ prefs, models });
}

export async function PUT(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const body = (await request.json()) as {
      defaultModelId?: string;
      backupModelId?: string;
      pinnedModelIds?: string[];
    };
    const prefs = await setAgentImageModelPrefs(agentId, body);
    return NextResponse.json({ prefs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save prefs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}