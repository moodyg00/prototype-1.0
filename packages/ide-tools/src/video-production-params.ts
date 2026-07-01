export const FRAME_RATE_VALUES = ['23.976', '24', '25', '29.97', '30', '48', '50', '60'] as const;
export type FrameRate = (typeof FRAME_RATE_VALUES)[number];

export const VIDEO_RESOLUTION_VALUES = ['480p', '720p', '1080p', '4k'] as const;
export type VideoResolution = (typeof VIDEO_RESOLUTION_VALUES)[number];

export const VIDEO_ASPECT_VALUES = ['16:9', '9:16', '1:1', '4:3', '21:9'] as const;
export type VideoAspectRatio = (typeof VIDEO_ASPECT_VALUES)[number];

/** How clips are aligned on the timeline. */
export type VideoSyncMode = 'auto' | 'manual' | 'beat' | 'speech' | 'scene' | 'none';

/** Audio relative to picture. */
export type AudioSyncMode = 'auto' | 'mute' | 'replace' | 'duck' | 'separate';

export type VideoAutoAssist = {
  cut: boolean;
  captions: boolean;
  broll: boolean;
  color: boolean;
  stabilize: boolean;
  upscale: boolean;
};

export type VideoProductionSettings = {
  frameRate: FrameRate;
  durationSeconds: number;
  resolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  syncMode: VideoSyncMode;
  audioSync: AudioSyncMode;
  auto: VideoAutoAssist;
  motionStrength: number;
  interpolate: boolean;
  loop: boolean;
  seed: number | null;
};

export const DEFAULT_VIDEO_AUTO: VideoAutoAssist = {
  cut: true,
  captions: false,
  broll: false,
  color: true,
  stabilize: false,
  upscale: false,
};

export const DEFAULT_VIDEO_PRODUCTION_SETTINGS: VideoProductionSettings = {
  frameRate: '30',
  durationSeconds: 6,
  resolution: '720p',
  aspectRatio: '16:9',
  syncMode: 'auto',
  audioSync: 'auto',
  auto: DEFAULT_VIDEO_AUTO,
  motionStrength: 50,
  interpolate: true,
  loop: false,
  seed: null,
};

export function normalizeVideoProductionSettings(
  partial?: Partial<VideoProductionSettings> | null,
): VideoProductionSettings {
  if (!partial) return { ...DEFAULT_VIDEO_PRODUCTION_SETTINGS, auto: { ...DEFAULT_VIDEO_AUTO } };
  return {
    ...DEFAULT_VIDEO_PRODUCTION_SETTINGS,
    ...partial,
    auto: { ...DEFAULT_VIDEO_AUTO, ...partial.auto },
    motionStrength: clamp(partial.motionStrength ?? 50, 0, 100),
    durationSeconds: clamp(partial.durationSeconds ?? 6, 2, 120),
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export const FRAME_RATE_OPTIONS: Array<{ value: FrameRate; label: string }> = [
  { value: '23.976', label: '23.976 (film)' },
  { value: '24', label: '24 fps' },
  { value: '25', label: '25 fps (PAL)' },
  { value: '29.97', label: '29.97 (NTSC)' },
  { value: '30', label: '30 fps' },
  { value: '48', label: '48 fps' },
  { value: '50', label: '50 fps' },
  { value: '60', label: '60 fps' },
];