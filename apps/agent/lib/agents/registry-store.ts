import fs from 'node:fs/promises';
import path from 'node:path';

import { isLegacyCsuiteAgentId } from './legacy-csuite';
import {
  CreateAgentBodySchema,
  UpdateAgentBodySchema,
  WorkspaceAgentSchema,
  defaultWorkspaceAgent,
  sanitizeEnabledToolIds,
  type WorkspaceAgent,
} from './types';

const REGISTRY_PATH = path.join(process.cwd(), '.data', 'agent-registry.json');

type Store = Record<string, WorkspaceAgent>;

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Store = {};
    for (const [key, value] of Object.entries(parsed)) {
      const result = WorkspaceAgentSchema.safeParse(value);
      if (result.success) out[key] = result.data;
    }
    return out;
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(store, null, 2), 'utf8');
}

/** Drop retired c-suite entries from the on-disk registry (one-time cleanup per read path). */
async function pruneLegacyAgentsFromStore(store: Store): Promise<Store> {
  let changed = false;
  for (const key of Object.keys(store)) {
    if (isLegacyCsuiteAgentId(key)) {
      delete store[key];
      changed = true;
    }
  }
  if (changed) await writeStore(store);
  return store;
}

export async function listWorkspaceAgents(): Promise<WorkspaceAgent[]> {
  const store = await pruneLegacyAgentsFromStore(await readStore());
  return Object.values(store)
    .filter((a) => !isLegacyCsuiteAgentId(a.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getWorkspaceAgent(agentId: string): Promise<WorkspaceAgent | null> {
  const store = await readStore();
  return store[agentId] ?? null;
}

export async function createWorkspaceAgent(input: unknown): Promise<WorkspaceAgent> {
  const body = CreateAgentBodySchema.parse(input);
  const store = await readStore();
  if (store[body.id]) {
    throw new Error(`Agent "${body.id}" already exists`);
  }
  const agent = defaultWorkspaceAgent(body.id, body.name);
  if (body.description) agent.description = body.description;
  agent.updatedAt = new Date().toISOString();
  store[body.id] = WorkspaceAgentSchema.parse(agent);
  await writeStore(store);
  return store[body.id];
}

export async function updateWorkspaceAgent(agentId: string, input: unknown): Promise<WorkspaceAgent> {
  const patch = UpdateAgentBodySchema.parse(input);
  const store = await readStore();
  const existing = store[agentId];
  if (!existing) throw new Error(`Agent "${agentId}" not found`);

  const next: WorkspaceAgent = {
    ...existing,
    ...patch,
    persona: patch.persona ? { ...existing.persona, ...patch.persona } : existing.persona,
    tools: patch.tools
      ? {
          ...existing.tools,
          ...patch.tools,
          enabledToolIds: patch.tools.enabledToolIds
            ? sanitizeEnabledToolIds(patch.tools.enabledToolIds)
            : existing.tools.enabledToolIds,
        }
      : existing.tools,
    training: patch.training ? { ...existing.training, ...patch.training } : existing.training,
    updatedAt: new Date().toISOString(),
  };

  store[agentId] = WorkspaceAgentSchema.parse(next);
  await writeStore(store);
  return store[agentId];
}

export async function deleteWorkspaceAgent(agentId: string): Promise<void> {
  const store = await readStore();
  if (!store[agentId]) throw new Error(`Agent "${agentId}" not found`);
  delete store[agentId];
  await writeStore(store);
}

/** Ensure registry contains entries for known memory/media slugs (no overwrite). */
export async function seedWorkspaceAgentsFromIds(ids: string[]): Promise<WorkspaceAgent[]> {
  let store = await pruneLegacyAgentsFromStore(await readStore());
  let changed = false;
  for (const id of ids) {
    const slug = id.trim();
    if (!slug || isLegacyCsuiteAgentId(slug) || store[slug]) continue;
    store[slug] = defaultWorkspaceAgent(slug);
    changed = true;
  }
  if (!store.default) {
    store.default = defaultWorkspaceAgent('default');
    changed = true;
  }
  if (changed) await writeStore(store);
  return Object.values(store)
    .filter((a) => !isLegacyCsuiteAgentId(a.id))
    .sort((a, b) => a.name.localeCompare(b.name));
}