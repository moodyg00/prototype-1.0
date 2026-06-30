import {
  applyTags,
  recallMemory,
  runMemoryIngestPipeline,
  shardToDrafts,
  getEmbedder,
  getMemoryStore,
  type MemoryScope,
  type SourceKind,
} from '@prototype/memory';
import { randomUUID as uuid } from 'crypto';

import { catalogMemoryChunks } from '../memory/catalog';
import { getMemoryBinding } from '../memory/bindings';
import type { GraphState } from './runtime';
import type { LangGraphNodeIR } from './types';

type MemoryState = Record<string, unknown> & {
  chunks?: Array<{ text: string; scopeKey?: string }>;
  recallResults?: unknown[];
  lastIngest?: { count: number; chunkIds: string[] };
  rawText?: string;
  scope?: MemoryScope;
};

function getMem(state: GraphState): MemoryState {
  return (state.memory ?? {}) as MemoryState;
}

function parseScope(props: Record<string, unknown>): MemoryScope {
  const kind = String(props.scopeKind ?? 'global');
  if (kind === 'global') return { kind: 'global' };
  const id = String(props.scopeId ?? props.agentId ?? 'default');
  if (kind === 'agent') return { kind: 'agent', id };
  if (kind === 'group') return { kind: 'group', id };
  return { kind: 'global' };
}

function parseTriggerPayload(state: GraphState, props: Record<string, unknown>): string {
  if (typeof props.rawText === 'string' && props.rawText.trim()) return props.rawText;
  if (state.input?.trim()) return state.input;
  try {
    const parsed = JSON.parse(state.input || '{}') as { text?: string };
    if (parsed.text) return parsed.text;
  } catch {
    // ignore
  }
  return state.input ?? '';
}

export function buildMemoryShardNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mem = getMem(state);
    const maxChars =
      typeof node.properties.maxChars === 'number' ? (node.properties.maxChars as number) : 1200;
    const rawText = mem.rawText ?? parseTriggerPayload(state, node.properties);
    const scope = mem.scope ?? parseScope(node.properties);
    const chunks = shardToDrafts(rawText, {
      scope,
      sourceKind: (node.properties.sourceKind as SourceKind) ?? 'domain',
      agentId: node.properties.agentId as string | undefined,
    }, { maxChars });

    return {
      memory: {
        ...mem,
        rawText,
        scope,
        ingestStatus: 'chunked',
        chunks: chunks.map((c) => ({
          text: c.text,
          scopeKey: c.scope.kind,
          ingestStatus: 'chunked' as const,
        })),
      },
      output: `Sharded into ${chunks.length} chunk(s)`,
    };
  };
}

export function buildMemoryTagNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mem = getMem(state);
    const scope = mem.scope ?? parseScope(node.properties);
    const agentId = String(node.properties.agentId ?? mem.agentId ?? 'default');
    const binding = await getMemoryBinding(agentId);
    const drafts =
      (mem.chunks as { text: string }[] | undefined)?.map((c) => ({
        text: c.text,
        scope,
        partition: String(node.properties.partition ?? binding.defaultPartition ?? 'default'),
        sourceKind: (node.properties.sourceKind as SourceKind) ?? 'domain',
        agentId,
      })) ?? [];

    let tagged;
    try {
      tagged = applyTags({
        drafts,
        scope,
        partition: String(node.properties.partition ?? binding.defaultPartition ?? 'default'),
        sourceKind: (node.properties.sourceKind as SourceKind) ?? 'domain',
        agentId,
        binding,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'tag failed';
      return {
        memory: { ...mem, ingestStatus: 'quarantined', quarantineReason: message },
        output: `Quarantined: ${message}`,
      };
    }

    return {
      memory: {
        ...mem,
        ingestStatus: 'tagged',
        chunks: tagged.map((t) => ({ ...t, ingestStatus: 'tagged' as const })),
      },
      output: `Tagged ${tagged.length} chunk(s)`,
    };
  };
}

export function buildMemoryEmbedNode(_node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mem = getMem(state);
    const chunks = (mem.chunks as Array<{ text: string }>) ?? [];
    const embedder = getEmbedder();
    const vectors = await embedder.embedMany(chunks.map((c) => c.text));
    const withEmb = chunks.map((c, i) => ({
      ...c,
      embedding: vectors[i],
      ingestStatus: 'embedded' as const,
    }));
    return {
      memory: { ...mem, ingestStatus: 'embedded', chunks: withEmb },
      output: `Embedded ${withEmb.length} chunk(s)`,
    };
  };
}

export function buildMemoryChromaUpsertNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mem = getMem(state);
    const chunks = (mem.chunks as Array<Record<string, unknown>>) ?? [];
    const store = getMemoryStore();
    const records = chunks.map((c) => ({
      id: uuid(),
      text: String(c.text ?? ''),
      scope: (mem.scope ?? parseScope(node.properties)) as MemoryScope,
      partition: String(c.partition ?? node.properties.partition ?? 'default'),
      sourceKind: (c.sourceKind as SourceKind) ?? 'domain',
      embedding: c.embedding as number[] | undefined,
      metadata: {
        ...((c.metadata as Record<string, unknown>) ?? {}),
        ingestStatus: (c.ingestStatus as string) ?? 'indexed',
      },
      ingestStatus: 'indexed' as const,
    }));
    await store.upsert(records);
    const workflowRunId =
      typeof mem.workflowRunId === 'string' ? mem.workflowRunId : undefined;
    await catalogMemoryChunks(records, workflowRunId);
    return {
      memory: {
        ...mem,
        lastIngest: { count: records.length, chunkIds: records.map((r) => r.id) },
      },
      output: `Upserted ${records.length} chunk(s) to memory store`,
    };
  };
}

export function buildMemoryRecallContextNode(node: LangGraphNodeIR) {
  return buildMemoryChromaRecallNode(node);
}

export function buildMemoryInjectNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mem = getMem(state);
    const hits = (mem.recallResults as Array<{ text: string; score: number }>) ?? [];
    const header = String(node.properties.header ?? '## Agent memory');
    const block =
      hits.length === 0
        ? ''
        : [
            header,
            '',
            ...hits.map((h, i) => `### Hit ${i + 1} (${h.score.toFixed(3)})\n${h.text}`),
            '',
          ].join('\n');
    return {
      memory: { ...mem, contextBlock: block },
      output: block,
      memoryContext: block,
    };
  };
}

export function buildMemoryChromaRecallNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    const mem = getMem(state);
    const query =
      (typeof node.properties.query === 'string' && node.properties.query.trim()) ||
      state.input?.trim() ||
      mem.rawText?.toString() ||
      'recent context';
    const agentId = String(node.properties.agentId ?? 'default');
    const topK = typeof node.properties.topK === 'number' ? (node.properties.topK as number) : 8;
    const scope = parseScope(node.properties);

    const binding = await getMemoryBinding(agentId);
    const hits = await recallMemory({
      agentId,
      query,
      topK,
      binding,
    });

    return {
      memory: { ...mem, recallResults: hits },
      output: hits.map((h) => h.text).join('\n---\n').slice(0, 4000),
    };
  };
}

export function buildMemoryIngestTriggerNode(node: LangGraphNodeIR) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(
        typeof node.properties.payload === 'string'
          ? (node.properties.payload as string)
          : state.input || '{}',
      ) as Record<string, unknown>;
    } catch {
      payload = { text: state.input };
    }

    const scope = parseScope({
      scopeKind: payload.scopeKind ?? node.properties.scopeKind,
      scopeId: payload.scopeId ?? node.properties.scopeId,
      agentId: payload.agentId ?? node.properties.agentId,
    });

    const rawText = String(payload.text ?? state.input ?? '');
    return {
      memory: {
        rawText,
        scope,
        sourceKind: payload.sourceKind,
        agentId: payload.agentId,
        workflowRunId: payload.workflowRunId,
      },
      input: rawText,
      output: rawText.slice(0, 200),
    };
  };
}

/** One-shot ingest for standard linear workflows without per-node state. */
export async function runFullIngestFromState(state: GraphState): Promise<Partial<GraphState>> {
  const mem = getMem(state);
  const text = mem.rawText ?? state.input;
  const scope = mem.scope ?? { kind: 'global' as const };
  const result = await runMemoryIngestPipeline({
    text,
    scope,
    sourceKind: (mem.sourceKind as SourceKind) ?? 'domain',
    agentId: typeof mem.agentId === 'string' ? mem.agentId : undefined,
  });
  return {
    memory: { ...mem, lastIngest: result },
    output: `Ingested ${result.count} chunks`,
  };
}