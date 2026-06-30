import {
  MEMORY_WORKFLOW_INGEST_NAME,
  MEMORY_WORKFLOW_INGEST_REVIEW_NAME,
  MEMORY_WORKFLOW_TURN_CAPTURE_NAME,
} from './constants';
import { prisma } from '../prisma';
import { validateWorkflow } from '../workflow/compiler';
import type { WorkflowDefinition } from '../workflow/types';
import { runStandardWorkflow, validateStandardWorkflow } from '../workflow/standard-runtime';

export async function loadWorkflowByName(name: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { name },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  if (!workflow?.versions[0]?.definition) {
    throw new Error(`Workflow "${name}" not found. Run scripts/seed-memory-workflows.ts`);
  }
  return { workflow, def: workflow.versions[0].definition as WorkflowDefinition };
}

export async function executeMemoryIngest(args: {
  workflowName?: string;
  inputPayload: Record<string, unknown>;
  runLabel?: string;
}) {
  const workflowName = args.workflowName ?? MEMORY_WORKFLOW_INGEST_NAME;
  const { workflow, def } = await loadWorkflowByName(workflowName);

  const validation = validateWorkflow(def);
  if (!validation.valid) {
    throw new Error(`Workflow invalid: ${validation.errors.map((e) => e.message).join('; ')}`);
  }

  if (def.kind === 'langgraph') {
    throw new Error(
      `Workflow "${workflowName}" is LangGraph. Run it from the Workflow → Runner panel (supports interrupt/resume).`,
    );
  }

  const standardError = validateStandardWorkflow(def);
  if (standardError) throw new Error(standardError);

  const startedAt = Date.now();
  const pending = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      workflowName: workflow.name,
      version: workflow.currentVersion,
      status: 'running',
      input: (args.runLabel ?? JSON.stringify(args.inputPayload)).slice(0, 8000),
      events: [],
      state: {},
    },
  });

  const input = JSON.stringify({
    ...args.inputPayload,
    workflowRunId: pending.id,
  });

  try {
    const result = await runStandardWorkflow(def, input);
    await prisma.workflowRun.update({
      where: { id: pending.id },
      data: {
        status: 'completed',
        output: (result.state.output ?? '').slice(0, 8000),
        threadId: pending.id,
        durationMs: Date.now() - startedAt,
        nodeCount: result.events.length,
        eventCount: result.events.length,
        tokens: result.state.tokens ?? 0,
        events: result.events as unknown as object,
        state: result.state as unknown as object,
      },
    });
    return { workflow, workflowRunId: pending.id, result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Ingest failed';
    await prisma.workflowRun.update({
      where: { id: pending.id },
      data: { status: 'error', errorText: message.slice(0, 4000) },
    });
    throw error;
  }
}

export async function startReviewMemoryIngest(args: { inputPayload: Record<string, unknown> }) {
  const { workflow } = await loadWorkflowByName(MEMORY_WORKFLOW_INGEST_REVIEW_NAME);
  const input = JSON.stringify(args.inputPayload);
  const base =
    process.env.AGENT_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://127.0.0.1:3002';

  const res = await fetch(`${base.replace(/\/$/, '')}/api/workflow/${workflow.id}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  const json = (await res.json()) as {
    error?: string;
    threadId?: string;
    runId?: string;
    status?: string;
    interrupt?: unknown;
  };
  if (!res.ok) throw new Error(json.error ?? 'Review ingest failed');

  return {
    workflow,
    mode: 'langgraph' as const,
    workflowId: workflow.id,
    threadId: json.threadId,
    workflowRunId: json.runId,
    status: json.status,
    interrupt: json.interrupt,
    message:
      json.status === 'interrupted'
        ? 'Paused for human review. Open Workflow → Runner and resume with the thread id shown in Runs.'
        : 'Review ingest completed.',
  };
}

export async function captureTurnToMemory(args: {
  agentId: string;
  input: string;
  output: string;
}) {
  const text = `Turn for agent ${args.agentId}\nUser: ${args.input}\nAgent: ${args.output}`;
  return executeMemoryIngest({
    workflowName: MEMORY_WORKFLOW_TURN_CAPTURE_NAME,
    runLabel: `turn:${args.agentId}`,
    inputPayload: {
      text,
      scopeKind: 'agent',
      scopeId: args.agentId,
      sourceKind: 'turn',
      agentId: args.agentId,
    },
  });
}