import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { FrameRate, VideoProductionSettings } from '@prototype/ide-tools';
import type { TimelineClip, VideoTimelineProject } from '@prototype/ide-tools';

const execFileAsync = promisify(execFile);

export type FfmpegProbe = {
  durationMs: number;
  fps?: number;
};

export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execFileAsync('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

export async function probeMediaFile(filePath: string): Promise<FfmpegProbe> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration:stream=avg_frame_rate',
      '-of',
      'json',
      filePath,
    ]);
    const data = JSON.parse(stdout) as {
      format?: { duration?: string };
      streams?: Array<{ avg_frame_rate?: string }>;
    };
    const sec = Number(data.format?.duration ?? 0);
    let fps: number | undefined;
    const rate = data.streams?.[0]?.avg_frame_rate;
    if (rate && rate.includes('/')) {
      const [n, d] = rate.split('/').map(Number);
      if (d) fps = n / d;
    }
    return { durationMs: Math.round(sec * 1000), fps };
  } catch {
    return { durationMs: 6000 };
  }
}

function fpsToFilter(fps: FrameRate): string {
  if (fps === '23.976') return '24000/1001';
  if (fps === '29.97') return '30000/1001';
  return fps;
}

export async function conformClipToFps(args: {
  inputPath: string;
  outputPath: string;
  frameRate: FrameRate;
}): Promise<void> {
  const vf = `fps=${fpsToFilter(args.frameRate)}`;
  await execFileAsync('ffmpeg', [
    '-y',
    '-i',
    args.inputPath,
    '-vf',
    vf,
    '-c:v',
    'libx264',
    '-preset',
    'fast',
    '-crf',
    '23',
    '-an',
    args.outputPath,
  ]);
}

export async function concatVideoClips(args: {
  segmentPaths: string[];
  outputPath: string;
  settings: VideoProductionSettings;
}): Promise<void> {
  if (args.segmentPaths.length === 0) throw new Error('No segments to concat');
  if (args.segmentPaths.length === 1) {
    await fs.copyFile(args.segmentPaths[0]!, args.outputPath);
    return;
  }
  const listPath = path.join(path.dirname(args.outputPath), `concat-${Date.now()}.txt`);
  const lines = args.segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  await fs.writeFile(listPath, lines, 'utf8');
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      listPath,
      '-c',
      'copy',
      args.outputPath,
    ]);
  } finally {
    await fs.unlink(listPath).catch(() => undefined);
  }
}

export async function downloadToTemp(url: string, ext: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-video-'));
  const filePath = path.join(dir, `src${ext}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download media: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(filePath, buf);
  return filePath;
}

export async function renderTimelineToFile(args: {
  project: VideoTimelineProject;
  resolveMediaUrl: (mediaId: string) => Promise<string | null>;
}): Promise<{ outputPath: string; usedFfmpeg: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const ffmpeg = await isFfmpegAvailable();
  const videoClips = args.project.clips
    .filter((c) => c.track === 'video')
    .sort((a, b) => a.startMs - b.startMs);

  if (videoClips.length === 0) throw new Error('Timeline has no video clips');

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agent-render-'));
  const outputPath = path.join(workDir, `render-${Date.now()}.mp4`);
  const segmentPaths: string[] = [];

  for (let i = 0; i < videoClips.length; i++) {
    const clip = videoClips[i]!;
    const url = await args.resolveMediaUrl(clip.mediaId);
    if (!url) {
      warnings.push(`Missing media ${clip.mediaId}`);
      continue;
    }
    const src = await downloadToTemp(url, '.mp4');
    const segOut = path.join(workDir, `seg-${i}.mp4`);
    if (ffmpeg) {
      const trimStart = (clip.inMs + clip.offsetMs) / 1000;
      const dur = clip.durationMs / 1000;
      await execFileAsync('ffmpeg', [
        '-y',
        '-ss',
        String(Math.max(0, trimStart)),
        '-i',
        src,
        '-t',
        String(dur),
        '-vf',
        `fps=${fpsToFilter(args.project.frameRate)}`,
        '-c:v',
        'libx264',
        '-preset',
        'fast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-shortest',
        segOut,
      ]);
    } else {
      await fs.copyFile(src, segOut);
      warnings.push('ffmpeg not found — segments copied without conform/trim');
    }
    segmentPaths.push(segOut);
  }

  if (segmentPaths.length === 0) throw new Error('No renderable segments');

  if (ffmpeg) {
    await concatVideoClips({
      segmentPaths,
      outputPath,
      settings: args.project.settings,
    });
  } else {
    await fs.copyFile(segmentPaths[0]!, outputPath);
  }

  return { outputPath, usedFfmpeg: ffmpeg, warnings };
}

export function applySyncOffsets(clips: TimelineClip[], syncMode: VideoProductionSettings['syncMode']): TimelineClip[] {
  if (syncMode === 'manual' || syncMode === 'none') return clips;
  return clips.map((c, i) => {
    if (syncMode === 'beat') {
      const grid = 500;
      const snapped = Math.round(c.startMs / grid) * grid;
      return { ...c, startMs: snapped, syncAnchor: 'beat' as const };
    }
    if (syncMode === 'speech') {
      return { ...c, offsetMs: i === 0 ? 0 : 120, syncAnchor: 'speech' as const };
    }
    if (syncMode === 'scene') {
      return { ...c, offsetMs: 0, syncAnchor: 'scene' as const };
    }
    return { ...c, syncAnchor: 'auto' as const };
  });
}