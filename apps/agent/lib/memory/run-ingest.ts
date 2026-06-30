import { MEMORY_WORKFLOW_INGEST_NAME } from './constants';
import { executeMemoryIngest } from './execute-ingest';

/** @deprecated Prefer executeMemoryIngest */
export async function runMemoryIngestWorkflow(input: string) {
  let payload: Record<string, unknown> = { text: input };
  try {
    payload = JSON.parse(input) as Record<string, unknown>;
  } catch {
    /* raw text */
  }
  const { workflow, result } = await executeMemoryIngest({
    workflowName: MEMORY_WORKFLOW_INGEST_NAME,
    inputPayload: payload,
  });
  return { workflow, result };
}