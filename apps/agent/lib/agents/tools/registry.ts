import type { AgentTool, ToolContext, ToolRegistrySnapshot } from './types';

export class ToolRegistry {
  private readonly tools = new Map<string, AgentTool>();

  register(tool: AgentTool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
  }

  registerMany(tools: AgentTool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  list(): ToolRegistrySnapshot {
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  async execute(name: string, ctx: ToolContext, input: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    const parsed = tool.inputSchema.parse(input);
    return tool.execute(ctx, parsed);
  }
}

export const toolRegistry = new ToolRegistry();