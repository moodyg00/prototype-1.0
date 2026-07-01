import fs from 'node:fs/promises';
import path from 'node:path';

import type { AgentImageModelPrefs } from '@prototype/ide-tools/image-models';
import { DEFAULT_AGENT_IMAGE_MODEL_PREFS } from '@prototype/ide-tools/image-models';

const PREFS_PATH = path.join(process.cwd(), '.data', 'image-model-prefs.json');

type Store = Record<string, AgentImageModelPrefs>;

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(PREFS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(PREFS_PATH), { recursive: true });
  await fs.writeFile(PREFS_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function getAgentImageModelPrefs(agentId: string): Promise<AgentImageModelPrefs> {
  const store = await readStore();
  return { ...DEFAULT_AGENT_IMAGE_MODEL_PREFS, ...store[agentId] };
}

export async function setAgentImageModelPrefs(
  agentId: string,
  prefs: Partial<AgentImageModelPrefs>,
): Promise<AgentImageModelPrefs> {
  const store = await readStore();
  const next = { ...DEFAULT_AGENT_IMAGE_MODEL_PREFS, ...store[agentId], ...prefs };
  store[agentId] = next;
  await writeStore(store);
  return next;
}