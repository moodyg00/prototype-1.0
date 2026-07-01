import { NextResponse } from 'next/server';

import { listVideoModelsWithConfig } from '@/lib/integrations/video-llm';
import {
  getAgentVideoModelPrefs,
  setAgentVideoModelPrefs,
} from '@/lib/media/video-model-prefs-store';
import { normalizeVideoProductionSettings } from '@prototype/ide-tools';

export const runtime = 'nodejs';

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  const prefs = await getAgentVideoModelPrefs(agentId);
  const models = await listVideoModelsWithConfig();
  return NextResponse.json({ prefs, models });
}

export async function PUT(request: Request, ctx: RouteCtx) {
  const { agentId } = await ctx.params;
  try {
    const body = (await request.json()) as {
      defaultModelId?: string;
      backupModelId?: string;
      pinnedModelIds?: string[];
      productionDefaults?: Record<string, unknown>;
    };
    const prefs = await setAgentVideoModelPrefs(agentId, {
      defaultModelId: body.defaultModelId,
      backupModelId: body.backupModelId,
      pinnedModelIds: body.pinnedModelIds,
      productionDefaults: body.productionDefaults
        ? normalizeVideoProductionSettings(body.productionDefaults as never)
        : undefined,
    });
    return NextResponse.json({ prefs });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save prefs';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}