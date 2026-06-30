import { buildMemoryContextBlock } from '@/lib/memory/recall-context';
import { invokeChatLlm } from '@/lib/workflow/llm-invoke';

import { agentMemoryService } from './memory/service';
import { bootstrapAgents } from './bootstrap';
import { toolRegistry } from './tools';
import type { ToolContext } from './tools/types';

export type AgentRunResult = {
  agentId: string;
  prompt: string;
  output: string;
  tools: ReturnType<typeof toolRegistry.list>;
  memoryPreview: Awaited<ReturnType<typeof agentMemoryService.recallRecent>>;
  memoryContext: string;
  tokens?: number;
};

export class AgentRuntime {
  async createContext(agentId: string): Promise<ToolContext> {
    bootstrapAgents();
    return { agentId };
  }

  async runTool(agentId: string, toolName: string, input: unknown): Promise<unknown> {
    const ctx = await this.createContext(agentId);
    const result = await toolRegistry.execute(toolName, ctx, input);
    await agentMemoryService.logEvent({
      agentId,
      type: 'tool',
      level: 1,
      content: `Executed ${toolName}`,
      metadata: { input, result },
    });
    return result;
  }

  async run(agentId: string, prompt: string): Promise<AgentRunResult> {
    const ctx = await this.createContext(agentId);
    const [memoryPreview, memoryContext] = await Promise.all([
      agentMemoryService.recallRecent(agentId, 5),
      buildMemoryContextBlock(agentId, prompt, 6),
    ]);

    let output = `[registered ${toolRegistry.list().length} tools; set XAI_API_KEY for LLM responses]`;
    let tokens = 0;

    try {
      const llm = await invokeChatLlm({
        input: prompt,
        memoryContext,
        systemPrompt: `You are agent ${agentId}, a department-head level assistant. Use retrieved memory when relevant.`,
      });
      output = llm.text;
      tokens = llm.tokens;
    } catch {
      // keep placeholder output when credentials missing
    }

    await agentMemoryService.handleTurnCommitted({
      agentId: ctx.agentId,
      input: prompt,
      output,
      toolsUsed: [],
    });

    return {
      agentId,
      prompt,
      output,
      tools: toolRegistry.list(),
      memoryPreview,
      memoryContext,
      tokens,
    };
  }
}

export const agentRuntime = new AgentRuntime();