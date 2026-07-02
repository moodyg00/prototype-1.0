'use client';

import type { ImageModelOption } from '@prototype/ide-tools/image-models';

type ModelRow = ImageModelOption & { configured: boolean };

export function ModelPicker({
  models,
  primaryId,
  backupId,
  onPrimaryChange,
  onBackupChange,
}: {
  models: ModelRow[];
  primaryId: string;
  backupId: string;
  onPrimaryChange: (id: string) => void;
  onBackupChange: (id: string) => void;
}) {
  const selectClass =
    'w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200 outline-none transition-colors focus:border-violet-500/50';

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-[10px] text-zinc-500">
        Primary model
        <select
          className={selectClass}
          value={primaryId}
          onChange={(e) => onPrimaryChange(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.configured}>
              {m.label}
              {!m.configured ? ' (no API key)' : ''}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[10px] text-zinc-500">
        Backup model
        <select
          className={selectClass}
          value={backupId}
          onChange={(e) => onBackupChange(e.target.value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.configured}>
              {m.label}
              {!m.configured ? ' (no API key)' : ''}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}