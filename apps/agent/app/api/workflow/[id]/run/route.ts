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

  if (missingLlmKey(ir)) {
    return NextResponse.json(
      { error: 'XAI_API_KEY is not configured on the server. Set it to run model nodes.' },
      { status: 400 },
    );
  }

  const timeoutMs = def.metadata?.timeoutMs && def.metadata.timeoutMs > 0
    ? def.metadata.timeoutMs
    : DEFAULT_TIMEOUT_MS;

  const threadId = body.threadId ?? randomUUID();
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
      return NextResponse.json({
        status: 'interrupted',
        threadId,
        events,
        state: finalState,
        interrupt: { node: interruptNode, prompt: interruptPrompt(ir, interruptNode) },
        validation,
      });
    }

    return NextResponse.json({
      status: 'completed',
      threadId,
      events,
      state: finalState,
      validation,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Run failed';
    return NextResponse.json(
      { status: 'error', threadId, events, error: message },
      { status: 500 },
    );
  }
}
