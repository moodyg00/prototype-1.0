import { randomUUID } from 'node:crypto';

import { AIMessage, type BaseMessage } from '@langchain/core/messages';
import type { StructuredToolInterface } from '@langchain/core/tools';
import {
  buildDesignPromptBlock,
  buildProjectManifest,
  DEFAULT_IDE_MODEL_ID,
  IDE_AGENT_SYSTEM_PROMPT,
  resolveIdeModel,
  type IdeToolContext,
  type ThoughtStep,
} from '@prototype/ide-tools';
import { buildIdeLangChainTools, IDE_TOOL_NAMES, type IdeToolName } from '@prototype/ide-tools/langchain';

import { langChainToolsToAnthropic, langChainToolsToOpenAi } from '../integrations/chat-tools';
import type { ChatMessage } from '../integrations/chat-types';
import { invokeIdeChat } from '../integrations/ide-llm';
import { ideToolNameFromType, type IdeRunState } from './ide-executors';
import type { GraphState } from './runtime';
import type { LangGraphNodeIR } from './types';

type ReasoningEffort = 'low' | 'medium' | 'high';

function historyToChatMessages(history: Array<{ role: string; content: string }>): ChatMessage[] {
  return history
    .filter((m) => m.content.trim())
    .map((m) =>
      m.role === 'assistant'
        ? ({ role: 'assistant' as const, content: m.content })
        : ({ role: 'user' as const, content: m.content }),
    );
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
 * Supports xAI, Anthropic, and OpenAI (Codex) via invokeIdeChat. The model id
 * comes from state.ide.modelId (chat picker) or the workflow node default.
 */
export function buildLlmAgentNode(node: LangGraphNodeIR, toolNodes: LangGraphNodeIR[]) {
  const toolNames = toolNodes
    .map((t: LangGraphNodeIR) => ideToolNameFromType(t.nodeType))
    .filter((n): n is IdeToolName => n !== null);

  const defaultModelId = node.model || DEFAULT_IDE_MODEL_ID;
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

    const modelId = ide.modelId ?? defaultModelId;
    const modelSpec = resolveIdeModel(modelId);

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
    const openAiTools = langChainToolsToOpenAi(tools);
    const anthropicTools = langChainToolsToAnthropic(tools);

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

    const history = (state.ideMessages ?? []).map((m: BaseMessage) => {
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

    const messages: ChatMessage[] = historyToChatMessages(history);
    if (history.length === 0 && state.input?.trim()) {
      messages.push({ role: 'user', content: state.input.trim() });
    }

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

    try {
      for (let i = 0; i < Math.max(1, maxIterations); i += 1) {
        const ai = await invokeIdeChat({
          modelId,
          systemPrompt,
          messages,
          tools: openAiTools.length ? openAiTools : undefined,
          anthropicTools: anthropicTools.length ? anthropicTools : undefined,
          reasoningEffort: modelSpec.provider === 'xai' ? reasoningEffort : undefined,
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
          toolCalls: ai.toolCalls.map((tc) => ({
            id: tc.id || `call_${step}_${tc.name}`,
            name: tc.name,
            args: tc.args,
          })),
        });

        for (const call of ai.toolCalls) {
          const tool = toolMap.get(call.name);
          const callId = call.id || `call_${step}_${call.name}`;
          const toolResult = tool
            ? await executeTool(tool, call.name, call.args, callId)
            : JSON.stringify({ error: `Unknown tool: ${call.name}` });

          effects.thoughts!.push({
            step,
            tool: call.name,
            summary: toolResult.slice(0, 120),
          });

          messages.push({
            role: 'tool',
            content: toolResult,
            toolCallId: callId,
          });
        }

        if (i === maxIterations - 1) {
          finalText = ai.content || 'Reached the maximum number of tool iterations before finishing.';
        }
      }
    } catch (err) {
      return {
        output: (err as Error).message,
        ide: {
          ...ide,
          runId,
          modelId,
          filesChanged: effects.filesChanged,
          requestDeploy: effects.requestDeploy,
          deployReason: effects.deployReason,
          events: effects.events,
          thoughts: effects.thoughts,
          checkpointedPaths: effects.checkpointedPaths,
        },
      };
    }

    return {
      output: finalText,
      tokens,
      ide: {
        ...ide,
        runId,
        modelId,
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
