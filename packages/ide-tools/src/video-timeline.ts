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

export type TimelineAnalysis = {
  /** Detected or user-set tempo. */
  bpm: number | null;
  /** Beat positions on the timeline (ms). */
  beatMarkersMs: number[];
  /** Normalized waveform peaks for UI (0–1), fixed bucket count. */
  waveformPeaks: number[];
};

export const DEFAULT_TIMELINE_ANALYSIS: TimelineAnalysis = {
  bpm: null,
  beatMarkersMs: [],
  waveformPeaks: [],
};

export type VideoTimelineProject = {
  id: string;
  agentId: string;
  name: string;
  frameRate: FrameRate;
  settings: VideoProductionSettings;
  clips: TimelineClip[];
  durationMs: number;
  analysis: TimelineAnalysis;
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
    analysis: { ...DEFAULT_TIMELINE_ANALYSIS },
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeTimeline(project: VideoTimelineProject): VideoTimelineProject {
  const settings = normalizeVideoProductionSettings(project.settings);
  const clips = [...project.clips].sort((a, b) => a.startMs - b.startMs);
  const analysis: TimelineAnalysis = {
    ...DEFAULT_TIMELINE_ANALYSIS,
    ...project.analysis,
    beatMarkersMs: [...(project.analysis?.beatMarkersMs ?? [])],
    waveformPeaks: [...(project.analysis?.waveformPeaks ?? [])],
  };
  return {
    ...project,
    settings,
    frameRate: settings.frameRate,
    clips,
    durationMs: computeTimelineDuration(clips),
    analysis,
    updatedAt: new Date().toISOString(),
  };
}

export function reorderTrackClips(
  clips: TimelineClip[],
  track: TimelineTrack,
  orderedIds: string[],
): TimelineClip[] {
  const onTrack = clips.filter((c) => c.track === track);
  const other = clips.filter((c) => c.track !== track);
  const byId = Object.fromEntries(onTrack.map((c) => [c.id, c]));
  const reordered: TimelineClip[] = [];
  let cursor = 0;
  for (const id of orderedIds) {
    const clip = byId[id];
    if (!clip) continue;
    reordered.push({ ...clip, startMs: cursor });
    cursor += clip.durationMs;
  }
  for (const c of onTrack) {
    if (!orderedIds.includes(c.id)) reordered.push(c);
  }
  return [...other, ...reordered];
}

export function beatIntervalMs(bpm: number): number {
  return Math.round(60_000 / Math.max(bpm, 1));
}

export function generateBeatMarkers(durationMs: number, bpm: number): number[] {
  const step = beatIntervalMs(bpm);
  const markers: number[] = [];
  for (let t = 0; t <= durationMs; t += step) markers.push(t);
  return markers;
}