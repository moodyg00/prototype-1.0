'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchJson } from '@/lib/memory/fetch-json';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';
import type { AgentVideoModelPrefs, VideoProductionSettings } from '@prototype/ide-tools';
import { VideoProductionParamsPanel } from './VideoProductionParamsPanel';

export function VideoProductionDrawerView({
  context: _context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [settings, setSettings] = useState<VideoProductionSettings | null>(null);

  const load = useCallback(async () => {
    const data = await fetchJson<{ prefs: AgentVideoModelPrefs }>(
      '/api/agents/default/video-models',
    );
    setSettings(data.prefs.productionDefaults);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(next: VideoProductionSettings) {
    setSettings(next);
    await fetch('/api/agents/default/video-models', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productionDefaults: next }),
    });
  }

  return (
    <div className="h-full overflow-auto bg-zinc-950 p-2">
      <p className="mb-2 text-[10px] font-medium text-zinc-300">Production parameters</p>
      {settings && (
        <VideoProductionParamsPanel settings={settings} onChange={(n) => void save(n)} compact />
      )}
    </div>
  );
}