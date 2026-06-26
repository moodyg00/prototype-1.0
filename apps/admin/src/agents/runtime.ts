import { generateText, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { createAgentMemory } from '../core/memory/agent-memory';
import { memoryService } from '../core/memory/service';
import { allMemoryTools } from '../core/memory/tools';
import { getActiveApiIntegration } from '@/src/lib/integrations/load-integration';

export interface AgentContext {
  agentId: string;
  memory: ReturnType<typeof createAgentMemory>;
  emitTask: (task: { title: string; description?: string; priority?: string; relatedEntity?: any }) => Promise<any>;
  getRecentActionsForTask: (taskId: string) => Promise<any[]>;
}

export class AgentRuntime {
  private tools: Record<string, any> = {};
  private contexts: Map<string, AgentContext> = new Map();

  registerTool(name: string, t: any) {
    this.tools[name] = t;
  }

  async createContext(agentId: string): Promise<AgentContext> {
    if (this.contexts.has(agentId)) return this.contexts.get(agentId)!;

    const memory = createAgentMemory(agentId);
    await memory.initialize();

    const ctx: AgentContext = {
      agentId,
      memory,
      async emitTask(taskInput) {
        const { taskStore } = await import('../core/tasks/store');
        const task = await taskStore.createTask({
          title: taskInput.title,
          description: taskInput.description,
          priority: (taskInput.priority as any) || 'medium',
          source: 'agent',
          sourceId: agentId,
          relatedEntity: taskInput.relatedEntity,
        });
        await memoryService.logStrategicEvent(
          agentId,
          `Emitted task: ${task.title}`,
          2,
          { taskId: task.id }
        );
        return task;
      },
      async getRecentActionsForTask(taskId: string) {
        const { taskStore } = await import('../core/tasks/store');
        const t = await taskStore.getTask(taskId);
        return t?.actionHistory || [];
      },
    };

    this.contexts.set(agentId, ctx);
    return ctx;
  }

  async run(agentId: string, prompt: string, opts?: { maxSteps?: number }) {
    const ctx = await this.createContext(agentId);
    const openaiIntegration = await getActiveApiIntegration('openai');
    const apiKey = openaiIntegration?.apiKey?.trim();

    const allTools = {
      ...this.tools,
      ...allMemoryTools,
      emit_task: tool({
        description: 'Create a new Task for the human admin or another agent to handle.',
        inputSchema: z.object({
          title: z.string(),
          description: z.string().optional(),
          priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        }),
        execute: async (args) => {
          return ctx.emitTask({
            title: args.title,
            description: args.description,
            priority: args.priority,
          });
        },
      }),
    };

    if (!apiKey) {
      const demoTask = await ctx.emitTask({
        title: `Review: ${prompt.slice(0, 80)}`,
        description: `Agent ${agentId} needs human input on: ${prompt}`,
        priority: 'medium',
      });
      await ctx.memory.handleTurnCommitted({
        input: prompt,
        output: `[DEMO MODE] Created task ${demoTask.id}`,
      });
      return {
        text: `[Demo] No OpenAI API key configured in Admin → API integrations. Created task ${demoTask.id}.`,
        toolCalls: [],
      };
    }

    const openai = createOpenAI({ apiKey });

    try {
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: `You are ${agentId}, a department-head level agent. Use memory tools heavily. Emit tasks for anything that needs human input or irreversible action. Be concise and decisive.`,
        prompt,
        tools: allTools,
        stopWhen: stepCountIs(opts?.maxSteps ?? 6),
      });

      await ctx.memory.handleTurnCommitted({
        input: prompt,
        output: result.text,
        toolsUsed: result.toolCalls?.map((c: any) => c.toolName) || [],
      });

      return { text: result.text, toolCalls: result.toolCalls };
    } catch (err: any) {
      // Fallback demo mode: still create useful Tasks + memory even without LLM key
      const demoTask = await ctx.emitTask({
        title: `Review: ${prompt.slice(0, 80)}`,
        description: `Agent ${agentId} needs human input on: ${prompt}`,
        priority: 'medium',
      });
      await ctx.memory.handleTurnCommitted({
        input: prompt,
        output: `[DEMO MODE] Created task ${demoTask.id}`,
      });
      return { text: `[Demo] LLM call failed: ${err.message}`, toolCalls: [] };
    }
  }
}

export const agentRuntime = new AgentRuntime();
