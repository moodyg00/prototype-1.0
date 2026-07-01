import { normalizeVideoProductionSettings } from '@prototype/ide-tools';

import { generateVideoForProduction } from '../integrations/video-llm';
import { saveGeneratedVideoBuffer } from '../media/agent-media-service';
import { getAgentMediaItem } from '../media/agent-media-service';
import { addClipFromMedia, getTimeline } from '../video/timeline-store';
import { runTimelineRender, runTimelineSync } from '../video/timeline-render-service';
import type { GraphState } from './runtime';
import type { LangGraphNodeIR } from './types';

type VideoMem = {
  lastMediaId?: string;
  lastRenderMediaId?: string;
  timelineProjectId?: string;
  production?: ReturnType<typeof normalizeVideoProductionSettings>;
  warnings?: string[];
};

function videoMem(state: GraphState): VideoMem {
  const root = (state.memory ?? {}) as Record<string, unknown>;
  return (root.video ?? {}) as VideoMem;
}

function withVideo(state: GraphState, patch: VideoMem): Partial<GraphState> {
  const root = { ...(state.memory ?? {}) };
  root.video = { ...videoMem(state), ...patch };
  return { memory: root };
}

function parseAgentId(props: Record<string, unknown>, state: GraphState): string {
  if (typeof props.agentId === 'string' && props.agentId.trim()) return props.agentId.trim();
  try {
    const parsed = JSON.parse(state.input || '{}') as { agentId?: string };
    if (parsed.agentId) return parsed.agentId;
  } catch {
    // ignore
  }
  return 'default';
}

function parsePrompt(props: Record<string, unknown>, state: GraphState): string {
  if (typeof props.prompt === 'string' && props.prompt.trim()) return props.prompt.trim();
  if (state.input?.trim()) return state.input.trim();
  try {
    const parsed = JSON.parse(state.input || '{}') as { prompt?: string };
    if (parsed.prompt) return parsed.prompt;
  } catch {
    // ignore
  }
  return '';
}

export function buildVideoGenerateNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const agentId = parseAgentId(node.properties, state);
    const prompt = parsePrompt(node.properties, state);
    if (!prompt) {
      return { output: 'Video generate skipped: no prompt', ...withVideo(state, {}) };
    }
    const settings = normalizeVideoProductionSettings(
      (node.properties.settings as object) ?? videoMem(state).production,
    );
    const gen = await generateVideoForProduction({
      modelId: String(node.properties.modelId ?? ''),
      prompt,
      settings,
    });
    const item = await saveGeneratedVideoBuffer({
      buffer: gen.buffer,
      mimeType: gen.mimeType,
      agentId,
      prompt,
      generationId: gen.generationId,
      settings: gen.settings,
    });
    const mediaId = item?.id;
    const summary = JSON.stringify({
      mediaId,
      stub: gen.stub,
      frameRate: gen.settings.frameRate,
      syncMode: gen.settings.syncMode,
    });
    return {
      output: summary,
      ...withVideo(state, { lastMediaId: mediaId, production: gen.settings }),
    };
  };
}

export function buildVideoTimelineLoadNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const agentId = parseAgentId(node.properties, state);
    const projectId = String(node.properties.projectId ?? 'default');
    const project = await getTimeline(agentId, projectId);
    return {
      output: JSON.stringify({ clipCount: project.clips.length, durationMs: project.durationMs }),
      ...withVideo(state, { timelineProjectId: projectId, production: project.settings }),
    };
  };
}

export function buildVideoTimelineAppendNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const agentId = parseAgentId(node.properties, state);
    const projectId = String(node.properties.projectId ?? videoMem(state).timelineProjectId ?? 'default');
    const mediaId =
      String(node.properties.mediaId ?? '') || videoMem(state).lastMediaId || '';
    if (!mediaId) {
      return { output: 'Timeline append skipped: no mediaId', ...withVideo(state, {}) };
    }
    const project = await addClipFromMedia({ agentId, projectId, mediaId });
    return {
      output: JSON.stringify({ clipCount: project.clips.length, mediaId }),
      ...withVideo(state, { lastMediaId: mediaId, timelineProjectId: projectId }),
    };
  };
}

export function buildVideoSyncNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const agentId = parseAgentId(node.properties, state);
    const projectId = String(node.properties.projectId ?? videoMem(state).timelineProjectId ?? 'default');
    const project = await runTimelineSync(agentId, projectId);
    return {
      output: JSON.stringify({
        syncMode: project.settings.syncMode,
        clips: project.clips.map((c) => ({ id: c.id, startMs: c.startMs, offsetMs: c.offsetMs })),
      }),
      ...withVideo(state, { timelineProjectId: projectId, production: project.settings }),
    };
  };
}

export function buildVideoRenderNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const agentId = parseAgentId(node.properties, state);
    const projectId = String(node.properties.projectId ?? videoMem(state).timelineProjectId ?? 'default');
    const result = await runTimelineRender(agentId, projectId);
    return {
      output: JSON.stringify({
        mediaId: result.item?.id,
        usedFfmpeg: result.usedFfmpeg,
        warnings: result.warnings,
      }),
      ...withVideo(state, {
        lastRenderMediaId: result.item?.id,
        timelineProjectId: projectId,
        warnings: result.warnings,
      }),
    };
  };
}

export function buildVideoMediaMetaNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mediaId =
      String(node.properties.mediaId ?? '') ||
      videoMem(state).lastRenderMediaId ||
      videoMem(state).lastMediaId ||
      '';
    if (!mediaId) return { output: '{}', ...withVideo(state, {}) };
    const item = await getAgentMediaItem(mediaId);
    if (!item) return { output: '{}', ...withVideo(state, {}) };
    const payload = {
      id: item.id,
      url: item.url,
      mediaKind: item.mediaKind,
      videoProduction: item.tags?.videoProduction ?? null,
    };
    return { output: JSON.stringify(payload), ...withVideo(state, { lastMediaId: mediaId }) };
  };
}