'use client';

import type { PaneRenderContext } from '@/lib/pane-types';
import { ModelPicker } from '../ModelPicker';
import { usePhotography } from '../PhotographyProvider';

export function ModelPickerPane({ context: _context }: { context: PaneRenderContext }) {
  const { agentId, setAgentId, agentIds, models, prefs, savePrefs } = usePhotography();

  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      <select
        className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px]"
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
      >
        {agentIds.map((id) => (
          <option key={id} value={id}>
            Agent: {id}
          </option>
        ))}
      </select>
      {prefs && models.length > 0 ? (
        <ModelPicker
          models={models}
          primaryId={prefs.defaultModelId}
          backupId={prefs.backupModelId}
          onPrimaryChange={(id) => void savePrefs({ defaultModelId: id })}
          onBackupChange={(id) => void savePrefs({ backupModelId: id })}
        />
      ) : (
        <p className="text-[11px] text-zinc-600">Loading models…</p>
      )}
    </div>
  );
}
