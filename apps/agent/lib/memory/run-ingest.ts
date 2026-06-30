import { MEMORY_WORKFLOW_INGEST_NAME } from './constants';
import { prisma } from '../prisma';
import { validateWorkflow } from '../workflow/compiler';
import type { WorkflowDefinition } from '../workflow/types';
import { runStandardWorkflow, validateStandardWorkflow } from '../workflow/standard-runtime';

export async function runMemoryIngestWorkflow(input: string) {
  const workflow = await prisma.workflow.findFirst({
    where: { name: MEMORY_WORKFLOW_INGEST_NAME },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!workflow?.versions[0]?.definition) {
    throw new Error(`Workflow "${MEMORY_WORKFLOW_INGEST_NAME}" not found. Run seed-memory-workflows.ts`);
  }

  const def = workflow.versions[0].definition as WorkflowDefinition;
  const validation = validateWorkflow(def);
  if (!validation.valid) {
    throw new Error(`Ingest workflow invalid: ${validation.errors.map((e) => e.message).join('; ')}`);
  }

  const standardError = validateStandardWorkflow(def);
  if (standardError) throw new Error(standardError);

  const result = await runStandardWorkflow(def, input);
  return { workflow, result };
}