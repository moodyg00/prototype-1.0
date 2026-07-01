import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  createDefaultTimeline,
  normalizeTimeline,
  reorderTrackClips,
  type TimelineClip,
  type TimelineTrack,
  type VideoTimelineProject,
} from '@prototype/ide-tools';

const STORE_PATH = path.join(process.cwd(), '.data', 'video-timelines.json');

type Store = Record<string, VideoTimelineProject>;

function key(agentId: string, projectId: string): string {
  return `${agentId}::${projectId}`;
}

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

export async function getTimeline(
  agentId: string,
  projectId = 'default',
): Promise<VideoTimelineProject> {
  const store = await readStore();
  const existing = store[key(agentId, projectId)];
  if (existing) return normalizeTimeline(existing);
  const created = createDefaultTimeline(agentId, projectId);
  store[key(agentId, projectId)] = created;
  await writeStore(store);
  return created;
}

export async function saveTimeline(project: VideoTimelineProject): Promise<VideoTimelineProject> {
  const store = await readStore();
  const next = normalizeTimeline(project);
  store[key(next.agentId, next.id)] = next;
  await writeStore(store);
  return next;
}

export async function addClipFromMedia(args: {
  agentId: string;
  projectId?: string;
  mediaId: string;
  label?: string;
  durationMs?: number;
  track?: TimelineClip['track'];
}): Promise<VideoTimelineProject> {
  const project = await getTimeline(args.agentId, args.projectId);
  const lastEnd = project.clips.reduce((m, c) => Math.max(m, c.startMs + c.durationMs), 0);
  const durationMs = args.durationMs ?? 6000;
  const clip: TimelineClip = {
    id: randomUUID(),
    mediaId: args.mediaId,
    label: args.label,
    track: args.track ?? 'video',
    startMs: lastEnd,
    durationMs,
    inMs: 0,
    outMs: 0,
    syncAnchor: project.settings.syncMode === 'manual' ? 'manual' : 'auto',
    offsetMs: 0,
  };
  return saveTimeline({ ...project, clips: [...project.clips, clip] });
}

export async function updateClip(
  agentId: string,
  projectId: string,
  clipId: string,
  patch: Partial<TimelineClip>,
): Promise<VideoTimelineProject> {
  const project = await getTimeline(agentId, projectId);
  const clips = project.clips.map((c) => (c.id === clipId ? { ...c, ...patch } : c));
  return saveTimeline({ ...project, clips });
}

export async function removeClip(
  agentId: string,
  projectId: string,
  clipId: string,
): Promise<VideoTimelineProject> {
  const project = await getTimeline(agentId, projectId);
  return saveTimeline({ ...project, clips: project.clips.filter((c) => c.id !== clipId) });
}

export async function reorderTimelineClips(args: {
  agentId: string;
  projectId?: string;
  track: TimelineTrack;
  orderedIds: string[];
}): Promise<VideoTimelineProject> {
  const project = await getTimeline(args.agentId, args.projectId);
  const clips = reorderTrackClips(project.clips, args.track, args.orderedIds);
  return saveTimeline({ ...project, clips });
}