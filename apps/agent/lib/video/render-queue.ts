import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { runTimelineRender } from './timeline-render-service';

export type RenderQueueStatus = 'queued' | 'running' | 'done' | 'failed';

export type RenderQueueJob = {
  id: string;
  agentId: string;
  projectId: string;
  status: RenderQueueStatus;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  mediaId?: string;
  error?: string;
  warnings?: string[];
  webhookUrl?: string;
};

const STORE_PATH = path.join(process.cwd(), '.data', 'video-render-queue.json');
const jobs = new Map<string, RenderQueueJob>();
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const arr = JSON.parse(raw) as RenderQueueJob[];
    for (const j of arr) jobs.set(j.id, j);
  } catch {
    /* empty */
  }
  loaded = true;
}

async function persist() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const arr = [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
  await fs.writeFile(STORE_PATH, JSON.stringify(arr, null, 2), 'utf8');
}

export async function enqueueRender(args: {
  agentId: string;
  projectId?: string;
  webhookUrl?: string;
}): Promise<RenderQueueJob> {
  await ensureLoaded();
  const job: RenderQueueJob = {
    id: randomUUID(),
    agentId: args.agentId,
    projectId: args.projectId ?? 'default',
    status: 'queued',
    createdAt: new Date().toISOString(),
    webhookUrl: args.webhookUrl,
  };
  jobs.set(job.id, job);
  await persist();
  void processJob(job.id);
  return job;
}

export async function getRenderJob(id: string): Promise<RenderQueueJob | null> {
  await ensureLoaded();
  return jobs.get(id) ?? null;
}

export async function listRenderJobs(agentId?: string): Promise<RenderQueueJob[]> {
  await ensureLoaded();
  const list = [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return agentId ? list.filter((j) => j.agentId === agentId).slice(0, 30) : list.slice(0, 30);
}

async function patchJob(id: string, patch: Partial<RenderQueueJob>) {
  const cur = jobs.get(id);
  if (!cur) return;
  jobs.set(id, { ...cur, ...patch });
  await persist();
}

async function notifyWebhook(job: RenderQueueJob) {
  if (!job.webhookUrl) return;
  try {
    await fetch(job.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId: job.id,
        status: job.status,
        mediaId: job.mediaId,
        error: job.error,
        agentId: job.agentId,
        projectId: job.projectId,
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function processJob(id: string) {
  await ensureLoaded();
  const job = jobs.get(id);
  if (!job || job.status !== 'queued') return;

  await patchJob(id, { status: 'running', startedAt: new Date().toISOString() });

  try {
    const result = await runTimelineRender(job.agentId, job.projectId);
    const done: RenderQueueJob = {
      ...job,
      status: 'done',
      finishedAt: new Date().toISOString(),
      mediaId: result.item?.id,
      warnings: result.warnings,
    };
    jobs.set(id, done);
    await persist();
    await notifyWebhook(done);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Render failed';
    const failed: RenderQueueJob = {
      ...job,
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: message,
    };
    jobs.set(id, failed);
    await persist();
    await notifyWebhook(failed);
  }
}