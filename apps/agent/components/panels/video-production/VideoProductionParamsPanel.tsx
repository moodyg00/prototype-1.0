'use client';

import type { ReactNode } from 'react';
import {
  FRAME_RATE_OPTIONS,
  VIDEO_ASPECT_VALUES,
  VIDEO_RESOLUTION_VALUES,
  type AudioSyncMode,
  type VideoAutoAssist,
  type VideoProductionSettings,
  type VideoSyncMode,
} from '@prototype/ide-tools';

const SYNC_MODES: Array<{ value: VideoSyncMode; label: string }> = [
  { value: 'auto', label: 'Auto (smart align)' },
  { value: 'manual', label: 'Manual timeline' },
  { value: 'beat', label: 'Beat / music sync' },
  { value: 'speech', label: 'Speech / dialogue' },
  { value: 'scene', label: 'Scene detection' },
  { value: 'none', label: 'None' },
];

const AUDIO_SYNC: Array<{ value: AudioSyncMode; label: string }> = [
  { value: 'auto', label: 'Auto mix' },
  { value: 'mute', label: 'Mute' },
  { value: 'replace', label: 'Replace audio' },
  { value: 'duck', label: 'Duck under VO' },
  { value: 'separate', label: 'Separate tracks' },
];

const selectClass =
  'w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500">{title}</div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}

function AutoToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-zinc-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-white/20"
      />
      {label}
    </label>
  );
}

export function VideoProductionParamsPanel({
  settings,
  onChange,
  compact,
}: {
  settings: VideoProductionSettings;
  onChange: (next: VideoProductionSettings) => void;
  compact?: boolean;
}) {
  const patch = (partial: Partial<VideoProductionSettings>) => onChange({ ...settings, ...partial });
  const patchAuto = (partial: Partial<VideoAutoAssist>) =>
    onChange({ ...settings, auto: { ...settings.auto, ...partial } });

  return (
    <div className={`grid gap-3 ${compact ? '' : 'lg:grid-cols-2'}`}>
      <Section title="Timing & frame rate">
        <label className="text-[10px] text-zinc-500">
          Frame rate
          <select
            className={selectClass}
            value={settings.frameRate}
            onChange={(e) => patch({ frameRate: e.target.value as VideoProductionSettings['frameRate'] })}
          >
            {FRAME_RATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-zinc-500">
          Duration (seconds)
          <input
            type="range"
            min={2}
            max={60}
            step={1}
            value={settings.durationSeconds}
            onChange={(e) => patch({ durationSeconds: Number(e.target.value) })}
            className="w-full"
          />
          <span className="text-zinc-400">{settings.durationSeconds}s</span>
        </label>
        <label className="flex items-center gap-2 text-[11px] text-zinc-400">
          <input
            type="checkbox"
            checked={settings.interpolate}
            onChange={(e) => patch({ interpolate: e.target.checked })}
          />
          Frame interpolation
        </label>
        <label className="flex items-center gap-2 text-[11px] text-zinc-400">
          <input type="checkbox" checked={settings.loop} onChange={(e) => patch({ loop: e.target.checked })} />
          Loop output
        </label>
      </Section>

      <Section title="Sync & audio">
        <label className="text-[10px] text-zinc-500">
          Clip sync mode
          <select
            className={selectClass}
            value={settings.syncMode}
            onChange={(e) => patch({ syncMode: e.target.value as VideoSyncMode })}
          >
            {SYNC_MODES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-zinc-500">
          Audio sync
          <select
            className={selectClass}
            value={settings.audioSync}
            onChange={(e) => patch({ audioSync: e.target.value as AudioSyncMode })}
          >
            {AUDIO_SYNC.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Output">
        <label className="text-[10px] text-zinc-500">
          Resolution
          <select
            className={selectClass}
            value={settings.resolution}
            onChange={(e) => patch({ resolution: e.target.value as VideoProductionSettings['resolution'] })}
          >
            {VIDEO_RESOLUTION_VALUES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-zinc-500">
          Aspect ratio
          <select
            className={selectClass}
            value={settings.aspectRatio}
            onChange={(e) => patch({ aspectRatio: e.target.value as VideoProductionSettings['aspectRatio'] })}
          >
            {VIDEO_ASPECT_VALUES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-zinc-500">
          Motion strength
          <input
            type="range"
            min={0}
            max={100}
            value={settings.motionStrength}
            onChange={(e) => patch({ motionStrength: Number(e.target.value) })}
            className="w-full"
          />
        </label>
        <label className="text-[10px] text-zinc-500">
          Seed (optional)
          <input
            className={selectClass}
            type="number"
            placeholder="Random"
            value={settings.seed ?? ''}
            onChange={(e) =>
              patch({ seed: e.target.value === '' ? null : Number(e.target.value) })
            }
          />
        </label>
      </Section>

      <Section title="Auto assists">
        <div className="grid grid-cols-2 gap-2">
          <AutoToggle label="Auto cut" checked={settings.auto.cut} onChange={(v) => patchAuto({ cut: v })} />
          <AutoToggle
            label="Auto captions"
            checked={settings.auto.captions}
            onChange={(v) => patchAuto({ captions: v })}
          />
          <AutoToggle label="Auto B-roll" checked={settings.auto.broll} onChange={(v) => patchAuto({ broll: v })} />
          <AutoToggle label="Auto color" checked={settings.auto.color} onChange={(v) => patchAuto({ color: v })} />
          <AutoToggle
            label="Stabilize"
            checked={settings.auto.stabilize}
            onChange={(v) => patchAuto({ stabilize: v })}
          />
          <AutoToggle label="Upscale" checked={settings.auto.upscale} onChange={(v) => patchAuto({ upscale: v })} />
        </div>
      </Section>
    </div>
  );
}