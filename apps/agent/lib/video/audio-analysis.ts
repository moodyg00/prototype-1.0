import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { generateBeatMarkers, type TimelineAnalysis } from '@prototype/ide-tools';

import { isFfmpegAvailable, probeMediaFile } from './ffmpeg-pipeline';

const execFileAsync = promisify(execFile);

const WAVEFORM_BUCKETS = 200;

export async function analyzeAudioFromFile(
  filePath: string,
  durationMs: number,
): Promise<TimelineAnalysis> {
  const peaks = await extractWaveformPeaks(filePath, durationMs);
  const bpm = estimateBpmFromPeaks(peaks, durationMs);
  const beatMarkersMs = bpm ? generateBeatMarkers(durationMs, bpm) : detectOnsetBeats(peaks, durationMs);
  return { bpm, beatMarkersMs, waveformPeaks: peaks };
}

export async function extractWaveformPeaks(filePath: string, durationMs: number): Promise<number[]> {
  const ffmpeg = await isFfmpegAvailable();
  if (!ffmpeg) return syntheticPeaks(durationMs);

  try {
    const { stderr } = await execFileAsync('ffmpeg', [
      '-i',
      filePath,
      '-af',
      `astats=metadata=1:reset=${Math.max(1, Math.floor(durationMs / WAVEFORM_BUCKETS))},ametadata=print:file=-`,
      '-f',
      'null',
      '-',
    ]);
    const rmsValues: number[] = [];
    for (const line of stderr.split('\n')) {
      const m = line.match(/RMS level dB:\s*(-?\d+(?:\.\d+)?)/);
      if (m) {
        const db = Number(m[1]);
        rmsValues.push(Math.max(0, Math.min(1, (db + 60) / 60)));
      }
    }
    if (rmsValues.length >= 8) return resamplePeaks(rmsValues, WAVEFORM_BUCKETS);
  } catch {
    /* fall through */
  }
  return syntheticPeaks(durationMs);
}

function resamplePeaks(values: number[], buckets: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < buckets; i++) {
    const start = Math.floor((i / buckets) * values.length);
    const end = Math.floor(((i + 1) / buckets) * values.length);
    let max = 0;
    for (let j = start; j < end; j++) max = Math.max(max, values[j] ?? 0);
    out.push(max);
  }
  return out;
}

function syntheticPeaks(durationMs: number): number[] {
  const buckets = WAVEFORM_BUCKETS;
  const out: number[] = [];
  for (let i = 0; i < buckets; i++) {
    const t = (i / buckets) * durationMs;
    const v = 0.35 + 0.25 * Math.sin(t / 400) + 0.15 * Math.sin(t / 120);
    out.push(Math.max(0, Math.min(1, v)));
  }
  return out;
}

function detectOnsetBeats(peaks: number[], durationMs: number): number[] {
  const markers: number[] = [0];
  const threshold = 0.55;
  const msPerBucket = durationMs / peaks.length;
  for (let i = 1; i < peaks.length; i++) {
    const prev = peaks[i - 1] ?? 0;
    const cur = peaks[i] ?? 0;
    if (cur > threshold && cur > prev * 1.15) {
      markers.push(Math.round(i * msPerBucket));
    }
  }
  return markers.length > 1 ? markers : generateBeatMarkers(durationMs, 120);
}

function estimateBpmFromPeaks(peaks: number[], durationMs: number): number | null {
  const onsets = detectOnsetBeats(peaks, durationMs).filter((t) => t > 0);
  if (onsets.length < 3) return 120;
  const intervals: number[] = [];
  for (let i = 1; i < onsets.length; i++) intervals.push(onsets[i]! - onsets[i - 1]!);
  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  if (avg < 200 || avg > 2000) return 120;
  return Math.round(60_000 / avg);
}

export async function analyzePrimaryAudioOnTimeline(args: {
  durationMs: number;
  bpmFallback: number | null;
  resolveFirstAudioPath: () => Promise<string | null>;
}): Promise<TimelineAnalysis> {
  const filePath = await args.resolveFirstAudioPath();
  if (filePath) {
    const probe = await probeMediaFile(filePath);
    return analyzeAudioFromFile(filePath, probe.durationMs || args.durationMs);
  }
  const bpm = args.bpmFallback ?? 120;
  return {
    bpm,
    beatMarkersMs: generateBeatMarkers(args.durationMs, bpm),
    waveformPeaks: syntheticPeaks(args.durationMs),
  };
}