export type PhotographyJobStatus = 'queued' | 'running' | 'done' | 'failed';

export type PhotographyJob = {
  id: string;
  agentId: string;
  modelId: string;
  prompt: string;
  status: PhotographyJobStatus;
  mediaId?: string;
  stub?: boolean;
  createdAt: string;
  error?: string;
};

const jobs: PhotographyJob[] = [];

export function listPhotographyJobs(agentId?: string): PhotographyJob[] {
  const list = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!agentId) return list.slice(0, 50);
  return list.filter((j) => j.agentId === agentId).slice(0, 50);
}

export function pushPhotographyJob(job: PhotographyJob) {
  jobs.unshift(job);
  if (jobs.length > 200) jobs.length = 200;
}

export function updatePhotographyJob(id: string, patch: Partial<PhotographyJob>) {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx >= 0) jobs[idx] = { ...jobs[idx]!, ...patch };
}