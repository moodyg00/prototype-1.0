import type { FrameRate, VideoProductionSettings } from './video-production-params';
import { DEFAULT_VIDEO_PRODUCTION_SETTINGS, normalizeVideoProductionSettings } from './video-production-params';

export type TimelineTrack = 'video' | 'audio' | 'overlay';

export type TimelineSyncAnchor = 'auto' | 'beat' | 'speech' | 'manual' | 'scene';

export type TimelineClip = {
  id: string;
  mediaId: string;
  label?: string;
  track: TimelineTrack;
  /** Timeline position (ms). */
  startMs: number;
  /** Visible duration on timeline (ms). */
  durationMs: number;
  /** Trim in-point within source (ms). */
  inMs: number;
  /** Trim out-point within source (ms); 0 = use full source. */
  outMs: number;
  syncAnchor: TimelineSyncAnchor;
  /** Manual / computed sync offset applied during render (ms). */
  offsetMs: number;
};

export type VideoTimelineProject = {
  id: string;
  agentId: string;
  name: string;
  frameRate: FrameRate;
  settings: VideoProductionSettings;
  clips: TimelineClip[];
  durationMs: number;
  updatedAt: string;
};

export function computeTimelineDuration(clips: TimelineClip[]): number {
  let max = 0;
  for (const c of clips) {
    max = Math.max(max, c.startMs + c.durationMs);
  }
  return max;
}

export function createDefaultTimeline(agentId: string, projectId = 'default'): VideoTimelineProject {
  const settings = normalizeVideoProductionSettings();
  return {
    id: projectId,
    agentId,
    name: 'Main edit',
    frameRate: settings.frameRate,
    settings,
    clips: [],
    durationMs: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeTimeline(project: VideoTimelineProject): VideoTimelineProject {
  const settings = normalizeVideoProductionSettings(project.settings);
  const clips = [...project.clips].sort((a, b) => a.startMs - b.startMs);
  return {
    ...project,
    settings,
    frameRate: settings.frameRate,
    clips,
    durationMs: computeTimelineDuration(clips),
    updatedAt: new Date().toISOString(),
  };
}