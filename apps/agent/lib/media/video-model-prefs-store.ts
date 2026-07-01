import fs from 'node:fs/promises';
import path from 'node:path';

import {
  DEFAULT_AGENT_VIDEO_MODEL_PREFS,
  normalizeVideoProductionSettings,
  type AgentVideoModelPrefs,
} from '@prototype/ide-tools';

const PREFS_PATH = path.join(process.cwd(), '.data', 'video-model-prefs.json');

type Store = Record<string, AgentVideoModelPrefs>;

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

function mergePrefs(partial?: Partial<AgentVideoModelPrefs>): AgentVideoModelPrefs {
  return {
    ...DEFAULT_AGENT_VIDEO_MODEL_PREFS,
    ...partial,
    productionDefaults: normalizeVideoProductionSettings(
      partial?.productionDefaults ?? DEFAULT_AGENT_VIDEO_MODEL_PREFS.productionDefaults,
    ),
  };
}

export async function getAgentVideoModelPrefs(agentId: string): Promise<AgentVideoModelPrefs> {
  const store = await readStore();
  return mergePrefs(store[agentId]);
}

export async function setAgentVideoModelPrefs(
  agentId: string,
  prefs: Partial<AgentVideoModelPrefs>,
): Promise<AgentVideoModelPrefs> {
  const store = await readStore();
  const next = mergePrefs({ ...store[agentId], ...prefs });
  store[agentId] = next;
  await writeStore(store);
  return next;
}