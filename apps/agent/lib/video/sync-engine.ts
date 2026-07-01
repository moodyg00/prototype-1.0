import type { TimelineClip, VideoProductionSettings, VideoTimelineProject } from '@prototype/ide-tools';
import { generateBeatMarkers } from '@prototype/ide-tools';

function nearestBeat(ms: number, beats: number[]): number {
  if (!beats.length) return ms;
  let best = beats[0]!;
  let dist = Math.abs(ms - best);
  for (const b of beats) {
    const d = Math.abs(ms - b);
    if (d < dist) {
      dist = d;
      best = b;
    }
  }
  return best;
}

export function snapClipsToBeatMarkers(
  clips: TimelineClip[],
  beatMarkersMs: number[],
  track: TimelineClip['track'] = 'video',
): TimelineClip[] {
  return clips.map((c) => {
    if (c.track !== track) return c;
    const snapped = nearestBeat(c.startMs, beatMarkersMs);
    return { ...c, startMs: snapped, syncAnchor: 'beat' as const };
  });
}

export function alignAudioToVideo(
  clips: TimelineClip[],
  settings: VideoProductionSettings,
): TimelineClip[] {
  const video = clips.filter((c) => c.track === 'video').sort((a, b) => a.startMs - b.startMs);
  const audio = clips.filter((c) => c.track === 'audio');
  if (!video.length || !audio.length) return clips;

  if (settings.audioSync === 'mute') {
    return clips.map((c) => (c.track === 'audio' ? { ...c, durationMs: 0, offsetMs: 0 } : c));
  }

  if (settings.audioSync === 'replace' || settings.audioSync === 'separate') {
    return clips;
  }

  const anchor = video[0]!.startMs;
  return clips.map((c) => {
    if (c.track !== 'audio') return c;
    return {
      ...c,
      startMs: anchor,
      offsetMs: settings.audioSync === 'duck' ? 80 : 0,
      syncAnchor: 'speech' as const,
    };
  });
}

export function applyProjectSync(project: VideoTimelineProject): VideoTimelineProject {
  let clips = [...project.clips];
  const mode = project.settings.syncMode;
  const beats =
    project.analysis.beatMarkersMs.length > 0
      ? project.analysis.beatMarkersMs
      : project.settings.bpm
        ? generateBeatMarkers(project.durationMs || 60_000, project.settings.bpm)
        : [];

  if (mode === 'beat' && beats.length) {
    clips = snapClipsToBeatMarkers(clips, beats, 'video');
    clips = snapClipsToBeatMarkers(clips, beats, 'audio');
  } else if (mode === 'speech') {
    clips = alignAudioToVideo(clips, project.settings);
  }

  clips = alignAudioToVideo(clips, project.settings);

  return { ...project, clips };
}