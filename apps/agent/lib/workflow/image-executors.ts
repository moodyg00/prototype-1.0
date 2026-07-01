import { generateImageForPhotography } from '../integrations/image-llm';
import { saveGeneratedImageBuffer } from '../media/agent-media-service';
import type { GraphState } from './runtime';
import type { LangGraphNodeIR } from './types';

/**
 * Photography/image-generation node. Calls the exact same service function
 * (`generateImageForPhotography` + `saveGeneratedImageBuffer`) that the standalone
 * Photography studio panel calls via `POST /api/photography/generate`, so a
 * workflow-driven image generation and a studio-driven one never diverge — this
 * is the visual-editor representation of the Photography tool (see node-catalog.ts).
 */

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

export function buildImageGenerateNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const agentId = parseAgentId(node.properties, state);
    const prompt = parsePrompt(node.properties, state);
    if (!prompt) {
      return { output: 'Image generate skipped: no prompt' };
    }
    const modelId = typeof node.properties.modelId === 'string' ? node.properties.modelId : undefined;

    const gen = await generateImageForPhotography({ modelId, prompt });
    const item = await saveGeneratedImageBuffer({
      buffer: gen.buffer,
      mimeType: gen.mimeType,
      agentId,
      prompt,
      generationId: gen.generationId,
    });

    const summary = JSON.stringify({ mediaId: item?.id, stub: gen.stub });
    return {
      output: summary,
      memory: { ...(state.memory ?? {}), image: { lastMediaId: item?.id } },
    };
  };
}
