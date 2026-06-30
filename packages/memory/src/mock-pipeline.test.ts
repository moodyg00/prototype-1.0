import assert from 'node:assert/strict';

import { resetEmbedderForTests } from './embed';
import { resetMemoryStoreForTests } from './store';
import { shardText } from './shard';
import { runMemoryIngestPipeline } from './pipeline';
import { recallMemory } from './recall';

async function main() {
  resetEmbedderForTests();
  resetMemoryStoreForTests();
  process.env.MEMORY_STORE = 'mock';
  delete process.env.CHROMA_URL;

  const binding = {
    agentId: 'cfo',
    readScopes: [{ kind: 'global' as const }, { kind: 'agent' as const, id: 'cfo' }],
    writeScopes: [{ kind: 'agent' as const, id: 'cfo' }],
    defaultPartition: 'default',
  };

  const shards = shardText('Acme Corp fiscal policy requires quarterly review.', { maxChars: 200 });
  assert.ok(shards.length >= 1);

  const { count } = await runMemoryIngestPipeline({
    text: 'Acme Corp fiscal policy requires quarterly review.',
    scope: { kind: 'agent', id: 'cfo' },
    sourceKind: 'domain',
    partition: 'finance',
    agentId: 'cfo',
  });
  assert.ok(count >= 1);

  const hits = await recallMemory({
    agentId: 'cfo',
    query: 'quarterly fiscal review',
    topK: 3,
    binding,
  });

  assert.ok(hits.length >= 1, 'expected at least one recall hit');
  console.log('[memory] mock pipeline test OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});