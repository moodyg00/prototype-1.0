import { recallMemory } from '@prototype/memory';

import { getMemoryBinding } from './bindings';

export async function buildMemoryContextBlock(agentId: string, query: string, topK = 6): Promise<string> {
  const binding = await getMemoryBinding(agentId);
  const hits = await recallMemory({ agentId, query, topK, binding });
  if (!hits.length) return '';

  const lines = hits.map(
    (h, i) => `### Memory ${i + 1} (score ${h.score.toFixed(3)})\n${h.text}`,
  );
  return ['## Retrieved agent memory', '', ...lines, ''].join('\n');
}