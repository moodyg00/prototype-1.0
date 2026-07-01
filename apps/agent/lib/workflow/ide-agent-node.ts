import { randomUUID } from 'node:crypto';

import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import {
  buildDesignPromptBlock,
  buildProjectManifest,
  IDE_AGENT_SYSTEM_PROMPT,
  type IdeToolContext,
  type ThoughtStep,
} from '@prototype/ide-tools';
import { buildIdeLangChainTools, IDE_TOOL_NAMES, type IdeToolName } from '@prototype/ide-tools/langchain';

import {
  invokeXaiChat,
  langChainToolsToXai,
  type XaiChatMessage,
} from '../integrations/xai-chat';
import { resolveXaiApiKey } from '../integrations/xai';
import { ideToolNameFromType, type IdeRunState } from './ide-executors';
import type { GraphState } from './runtime';
import type { LangGraphNodeIR } from './types';

type ReasoningEffort = 'low' | 'medium' | 'high';

function lcMessagesToXai(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  lastUser?: string,
): XaiChatMessage[] {
  const out: XaiChatMessage[] = [{ role: 'system', content: systemPrompt }];
  for (const m of history) {
    if (m.role === 'assistant') out.push({ role: 'assistant', content: m.content });
    else if (m.role === 'user') out.push({ role: 'user', content: m.content });
  }
  if (lastUser && !history.some((m) => m.role === 'user' && m.content === lastUser)) {
    out.push({ role: 'user', content: lastUser });
  }
  return out;
}

async function executeTool(
  tool: StructuredToolInterface,
  name: string,
  args: Record<string, unknown>,
  callId: string,
): Promise<string> {
  try {
    const result = await tool.invoke(args);
    if (typeof result === 'string') return result;
    if (result && typeof result === 'object' && 'content' in result) {
      return String((result as { content: unknown }).content ?? '');
    }
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({ error: (err as Error).message, tool: name, callId });
  }
}

/**
 * Build the IDE agent (ReAct) node executor.
 *
 * Uses direct xAI chat/completions so reasoning_content is preserved. Tool nodes
 * wired into the agent's "tools" input are mapped to LangChain tools that are
 * hard-scoped to the project slug in state.ide.
 */
export function buildLlmAgentNode(node: LangGraphNodeIR, toolNodes: LangGraphNodeIR[]) {
  const toolNames = toolNodes
    .map((t: LangGraphNodeIR) => ideToolNameFromType(t.nodeType))
    .filter((n): n is IdeToolName => n !== null);

  const model = node.model || 'grok-4.3';
  const reasoningEffort = ((): ReasoningEffort => {
    const raw = node.properties.reasoningEffort;
    return raw === 'medium' || raw === 'high' ? raw : 'low';
  })();
  const maxIterations =
    typeof node.properties.maxIterations === 'number'
      ? (node.properties.maxIterations as number)
      : 10;

  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const ide: IdeRunState = state.ide ?? {};
    const slug = ide.slug;
    if (!slug) {
      return { output: 'IDE agent error: no project slug in run context.' };
    }

    const apiKey = await resolveXaiApiKey();
    if (!apiKey) {
      return {
        output:
          'No xAI API key is configured. Set XAI_API_KEY in apps/agent/.env.local or add an active xAI integration.',
      };
    }

    const runId = ide.runId ?? randomUUID();
    const effects = {
      filesChanged: ide.filesChanged ?? false,
      requestDeploy: ide.requestDeploy ?? false,
      deployReason: ide.deployReason,
      events: ide.events ? [...ide.events] : [],
      thoughts: ide.thoughts ? [...ide.thoughts] : [],
      runId,
      checkpointedPaths: ide.checkpointedPaths ? [...ide.checkpointedPaths] : [],
    };
    const ctx: IdeToolContext = { slug, effects };
    const essentialTools: IdeToolName[] = ['read_file', 'patch_file', 'revert_checkpoint', 'list_files'];
    const selectedTools = [
      ...new Set([...(toolNames.length ? toolNames : IDE_TOOL_NAMES), ...essentialTools]),
    ] as IdeToolName[];
    const tools = buildIdeLangChainTools(ctx, selectedTools);
    const toolMap = new Map<string, StructuredToolInterface>(tools.map((t) => [t.name, t]));
    const xaiTools = langChainToolsToXai(tools);

    let systemPrompt =
      (typeof node.systemPrompt === 'string' && node.systemPrompt.trim()) ||
      IDE_AGENT_SYSTEM_PROMPT(slug);

    try {
      const manifest = await buildProjectManifest(slug);
      systemPrompt += `\n\n${manifest}`;
    } catch {
      /* manifest is best-effort */
    }

    const design = ide.designContext;
    if (design && design.selections.length > 0) {
      systemPrompt +=
        '\n\nThe user is using Design Mode and selected elements in the live preview. ' +
        'Apply their request to the corresponding source by editing the page listed below and any CSS/JS it references. ' +
        'Prefer patch_file for minimal edits.\n\n' +
        buildDesignPromptBlock(design);
    }

    const history = (state.ideMessages ?? []).map((m) => {
      const content =
        typeof m.content === 'string'
          ? m.content
          : Array.isArray(m.content)
            ? m.content
                .map((p) =>
                  typeof p === 'string'
                    ? p
                    : p && typeof p === 'object' && 'text' in p
                      ? String((p as { text: unknown }).text ?? '')
                      : '',
                )
                .join('')
            : String(m.content ?? '');
      const role = m instanceof AIMessage ? 'assistant' : 'user';
      return { role, content };
    });

    const messages: XaiChatMessage[] = lcMessagesToXai(
      systemPrompt,
      history,
      history.length === 0 ? state.input : undefined,
    );

    if (design?.screenshotDataUrl) {
      messages.push({
        role: 'user',
        content:
          'Screenshot of the current selection (red marks = my annotations): [image attached in design context]',
      });
    }

    let tokens = 0;
    let finalText = '';
    let step = 0;

    for (let i = 0; i < Math.max(1, maxIterations); i += 1) {
      const ai = await invokeXaiChat({
        apiKey,
        model,
        messages,
        tools: xaiTools.length ? xaiTools : undefined,
        reasoningEffort,
      });
      tokens += ai.totalTokens;
      step += 1;

      if (ai.reasoningContent?.trim()) {
        effects.thoughts!.push({
          step,
          reasoning: ai.reasoningContent.trim(),
        });
      }

      if (!ai.toolCalls.length) {
        finalText = ai.content || '(done)';
        messages.push({ role: 'assistant', content: ai.content });
        break;
      }

      messages.push({
        role: 'assistant',
        content: ai.content || '',
        tool_calls: ai.toolCalls.map((tc) => ({
          id: tc.id || `call_${step}_${tc.name}`,
          type: 'function' as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.args) },
        })),
      });

      for (const call of ai.toolCalls) {
        const tool = toolMap.get(call.name);
        const toolResult = tool
          ? await executeTool(tool, call.name, call.args, call.id)
          : JSON.stringify({ error: `Unknown tool: ${call.name}` });

        effects.thoughts!.push({
          step,
          tool: call.name,
          summary: toolResult.slice(0, 120),
        });

        messages.push({
          role: 'tool',
          content: toolResult,
          tool_call_id: call.id || `call_${step}`,
        });
      }

      if (i === maxIterations - 1) {
        finalText = ai.content || 'Reached the maximum number of tool iterations before finishing.';
      }
    }

    return {
      output: finalText,
      tokens,
      ide: {
        ...ide,
        runId,
        filesChanged: effects.filesChanged,
        requestDeploy: effects.requestDeploy,
        deployReason: effects.deployReason,
        events: effects.events,
        thoughts: effects.thoughts,
        checkpointedPaths: effects.checkpointedPaths,
      },
    };
  };
}
