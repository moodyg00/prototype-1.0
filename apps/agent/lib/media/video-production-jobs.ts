import type { VideoProductionSettings } from '@prototype/ide-tools';

export type VideoProductionJobStatus = 'queued' | 'running' | 'syncing' | 'done' | 'failed';

export type VideoProductionJob = {
  id: string;
  agentId: string;
  modelId: string;
  prompt: string;
  status: VideoProductionJobStatus;
  settings: VideoProductionSettings;
  mediaId?: string;
  stub?: boolean;
  createdAt: string;
  error?: string;
  progress?: number;
};

const jobs: VideoProductionJob[] = [];

export function listVideoProductionJobs(agentId?: string): VideoProductionJob[] {
  const list = [...jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!agentId) return list.slice(0, 50);
  return list.filter((j) => j.agentId === agentId).slice(0, 50);
}

export function pushVideoProductionJob(job: VideoProductionJob) {
  jobs.unshift(job);
  if (jobs.length > 200) jobs.length = 200;
}

export function updateVideoProductionJob(id: string, patch: Partial<VideoProductionJob>) {
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx >= 0) jobs[idx] = { ...jobs[idx]!, ...patch };
}