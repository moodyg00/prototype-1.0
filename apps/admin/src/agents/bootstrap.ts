import { agentRuntime } from './runtime';
import { allMemoryTools } from '../core/memory/tools';
import { memoryService } from '../core/memory/service';
import { z } from 'zod';

export async function bootstrapAgents() {
  await memoryService.initialize();

  // Register memory tuning tools
  Object.entries(allMemoryTools).forEach(([name, t]) => {
    agentRuntime.registerTool(name, t);
  });

  // Register a simple "ai shell" style tool
  agentRuntime.registerTool('ai_shell', {
    description: 'Execute a safe shell-like command or query (demo only).',
    inputSchema: z.object({ command: z.string() }),
    execute: async ({ command }: { command: string }) => {
      return { result: `Executed (demo): ${command}`, success: true };
    },
  });

  console.log('[agents] Bootstrap complete. Memory tools + ai_shell registered.');
}

export async function runDemoAgent(prompt: string, agentId = 'ops-chief') {
  await bootstrapAgents();
  return agentRuntime.run(agentId, prompt);
}
