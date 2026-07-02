import type { WorkspaceAgent } from './types';
import { formatEnabledToolsForPrompt } from './tool-policy';
import { formatTrainingExamplesForPrompt } from './training-prompt';

export function buildAgentSystemPrompt(agent: WorkspaceAgent, memoryContext?: string): string {
  const parts: string[] = [];
  const base = agent.persona.systemPrompt?.trim();
  if (base) parts.push(base);
  else {
    parts.push(
      `You are ${agent.name}, an AI agent in the prototype agent IDE (id: ${agent.id}).`,
    );
  }
  if (agent.persona.style?.trim()) {
    parts.push('', 'Style:', agent.persona.style.trim());
  }
  if (agent.persona.constraints?.length) {
    parts.push('', 'Constraints:', ...agent.persona.constraints.map((c) => `- ${c}`));
  }
  if (agent.description?.trim()) {
    parts.push('', 'About this agent:', agent.description.trim());
  }
  const toolsBlock = formatEnabledToolsForPrompt(agent);
  if (toolsBlock) parts.push('', toolsBlock);
  const trainingBlock = formatTrainingExamplesForPrompt(agent);
  if (trainingBlock) parts.push('', trainingBlock);
  if (memoryContext?.trim()) {
    parts.push('', '--- Retrieved memory ---', memoryContext.trim());
  }
  return parts.join('\n');
}