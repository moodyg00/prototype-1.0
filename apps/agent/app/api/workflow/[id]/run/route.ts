import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { HumanMessage } from '@langchain/core/messages';
import { prisma } from '../../../../../lib/prisma';
import type { WorkflowDefinition } from '../../../../../lib/workflow/types';
import { compileToLangGraphIR, validateWorkflow } from '../../../../../lib/workflow/compiler';
import {
  buildGraph,
  interruptPrompt,
  missingLlmKey,
  serializeState,
  type GraphState,
} from '../../../../../lib/workflow/runtime';
import {
  runStandardWorkflow,
  validateStandardWorkflow,
} from '../../../../../lib/workflow/standard-runtime';
import { resolveXaiApiKey } from '../../../../../lib/integrations/xai';

type Params = { params: Promise<{ id: string }> };

interface RunBody {
  input?: string;
  threadId?: string;
  resume?: boolean;
  resumeValue?: string;
  compileOnly?: boolean;
}

interface RunEvent {
  node: string;
  update: ReturnType<typeof serializeState>;
}

const DEFAULT_TIMEOUT_MS = 120_000;

// Persist a native run/trace record. Best-effort: a logging failure must never
// break the actual run response. Replaces external LangSmith tracing.
async function recordRun(args: {
  workflowId: string;
  workflowName: string;
  version: number;
  status: 'completed' | 'interrupted' | 'error';
  input: string;
  threadId: string;
  startedAt: number;
  events: RunEvent[];
  state: ReturnType<typeof serializeState>;
  nodeCount: number;
  errorText?: string;
}): Promise<string | null> {
  try {
    const row = await prisma.workflowRun.create({
      data: {
        workflowId: args.workflowId,
        workflowName: args.workflowName,
        version: args.version,
        status: args.status,
        input: args.input.slice(0, 8000),
        output: (args.state.output ?? '').slice(0, 8000),
        errorText: args.errorText?.slice(0, 4000),
        threadId: args.threadId,
        durationMs: Date.now() - args.startedAt,
        nodeCount: args.nodeCount,
        eventCount: args.events.length,
        tokens: args.state.tokens ?? 0,
        events: args.events as unknown as object,
        state: args.state as unknown as object,
      },
    });
    return row.id;
  } catch (err) {
    console.error('[workflow/run] Failed to record run:', err);
    return null;
  }
}

// POST /api/workflow/[id]/run — compile the latest definition server-side and
// execute it with LangGraph. Supports human-in-the-loop interrupt + resume.
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  let body: RunBody = {};
  try {
    body = (await req.json()) as RunBody;
  } catch {
    // empty body is allowed (defaults to a fresh run with no input)
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const def = workflow.versions[0]?.definition as WorkflowDefinition | undefined;
  if (!def) {
    return NextResponse.json({ error: 'No versions found' }, { status: 400 });
  }

  const validation = validateWorkflow(def);
  const ir = compileToLangGraphIR(def);

  if (body.compileOnly) {
    return NextResponse.json({ status: 'compiled', validation, ir });
  }

  if (!validation.valid) {
    return NextResponse.json({ error: 'Validation failed', validation }, { status: 422 });
  }

  const workflowName = workflow.name;
  const version = workflow.currentVersion;
  const runInput = body.resume ? (body.resumeValue ?? '') : (body.input ?? '');
  const startedAt = Date.now();
  const threadId = body.threadId ?? randomUUID();

  if (def.kind === 'standard' && !body.resume) {
    const standardError = validateStandardWorkflow(def);
    if (standardError) {
      return NextResponse.json({ error: standardError }, { status: 422 });
    }
    try {
      const result = await runStandardWorkflow(def, runInput);
      const runId = await recordRun({
        workflowId: id,
        workflowName,
        version,
        status: 'completed',
        input: runInput,
        threadId,
        startedAt,
        events: result.events,
        state: result.state,
        nodeCount: def.nodes.length,
      });
      return NextResponse.json({
        status: 'completed',
        engine: 'langchain-standard',
        threadId,
        runId,
        events: result.events,
        state: result.state,
        validation,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Standard run failed';
      await recordRun({
        workflowId: id,
        workflowName,
        version,
        status: 'error',
        input: runInput,
        threadId,
        startedAt,
        events: [],
        state: serializeState({ input: runInput, output: '', messages: [], memory: {}, tokens: 0 }),
        nodeCount: def.nodes.length,
        errorText: message,
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (missingLlmKey(ir)) {
    // Env key is absent — fall back to an active xAI Integration row before failing.
    const fallbackKey = await resolveXaiApiKey();
    if (!fallbackKey) {
      return NextResponse.json(
        { error: 'No xAI credential configured. Set XAI_API_KEY or add an active xAI integration.' },
        { status: 400 },
      );
    }
  }

  const timeoutMs = def.metadata?.timeoutMs && def.metadata.timeoutMs > 0
    ? def.metadata.timeoutMs
    : DEFAULT_TIMEOUT_MS;

  const { graph } = buildGraph(ir);
  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: 50,
    signal: AbortSignal.timeout(timeoutMs),
  };

  const events: RunEvent[] = [];

  try {
    let streamInput: Partial<GraphState> | null;

    if (body.resume) {
      if (typeof body.resumeValue === 'string' && body.resumeValue.length > 0) {
        await graph.updateState(config, {
          input: body.resumeValue,
          messages: [new HumanMessage(body.resumeValue)],
        });
      }
      streamInput = null; // null resumes from the saved checkpoint
    } else {
      const input = body.input ?? '';
      streamInput = {
        input,
        messages: input ? [new HumanMessage(input)] : [],
      };
    }

    const stream = await graph.stream(streamInput, { ...config, streamMode: 'updates' });
    for await (const chunk of stream) {
      for (const [node, update] of Object.entries(chunk as Record<string, Partial<GraphState>>)) {
        events.push({ node, update: serializeState(update ?? {}) });
      }
    }

    const snapshot = await graph.getState(config);
    const nextNodes: string[] = (snapshot?.next as string[] | undefined) ?? [];
    const finalState = serializeState((snapshot?.values ?? {}) as Partial<GraphState>);

    if (nextNodes.length > 0) {
      const interruptNode = nextNodes[0];
      const runId = await recordRun({
        workflowId: id, workflowName, version, status: 'interrupted',
        input: runInput, threadId, startedAt, events, state: finalState,
        nodeCount: ir.nodes.length,
      });
      return NextResponse.json({
        status: 'interrupted',
        threadId,
        runId,
        events,
        state: finalState,
        interrupt: { node: interruptNode, prompt: interruptPrompt(ir, interruptNode) },
        validation,
      });
    }

    const runId = await recordRun({
      workflowId: id, workflowName, version, status: 'completed',
      input: runInput, threadId, startedAt, events, state: finalState,
      nodeCount: ir.nodes.length,
    });
    return NextResponse.json({
      status: 'completed',
      threadId,
      runId,
      events,
      state: finalState,
      validation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Run failed';
    await recordRun({
      workflowId: id, workflowName, version, status: 'error',
      input: runInput, threadId, startedAt, events,
      state: serializeState({}), nodeCount: ir.nodes.length, errorText: message,
    });
    return NextResponse.json(
      { status: 'error', threadId, events, error: message },
      { status: 500 },
    );
  }
}
