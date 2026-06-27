import { agentMemoryService } from './memory/service';
import { bootstrapAgents } from './bootstrap';
import { toolRegistry } from './tools';
import type { ToolContext } from './tools/types';

export type AgentRunResult = {
  agentId: string;
  prompt: string;
  tools: ReturnType<typeof toolRegistry.list>;
  memoryPreview: Awaited<ReturnType<typeof agentMemoryService.recallRecent>>;
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
    const memoryPreview = await agentMemoryService.recallRecent(agentId, 5);

    await agentMemoryService.handleTurnCommitted({
      agentId: ctx.agentId,
      input: prompt,
      output: `[registered ${toolRegistry.list().length} tools; awaiting LLM graph runner]`,
      toolsUsed: [],
    });

    return {
      agentId,
      prompt,
      tools: toolRegistry.list(),
      memoryPreview,
    };
  }
}

export const agentRuntime = new AgentRuntime();