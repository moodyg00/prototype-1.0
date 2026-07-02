import type { WorkspaceAgent } from './types';

export function formatTrainingExamplesForPrompt(agent: WorkspaceAgent): string | null {
  const examples = agent.training.examples ?? [];
  if (!examples.length) return null;
  const blocks = examples.map((ex, i) =>
    [`Example ${i + 1}:`, `User: ${ex.user}`, `Assistant: ${ex.assistant}`].join('\n'),
  );
  return ['Few-shot examples (match this tone and format when similar):', '', ...blocks].join('\n\n');
}