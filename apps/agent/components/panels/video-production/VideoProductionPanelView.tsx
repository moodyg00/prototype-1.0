'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { dispatchAgentNavigate } from '@/lib/agent-navigation';
import type { ToolRenderContext } from '@/lib/tool-surfaces';
import type { ToolId } from '@/lib/tools';

export function VideoProductionPanelView({
  context: _context,
}: {
  toolId: ToolId;
  context: ToolRenderContext;
}) {
  const [prompt, setPrompt] = useState('');

  async function quickGenerate() {
    if (!prompt.trim()) {
      toast.error('Enter a prompt');
      return;
    }
    try {
      const res = await fetch('/api/video-production/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), agentId: 'default' }),
      });
      const data = (await res.json()) as { error?: string; stub?: boolean };
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      toast.success(data.stub ? 'Stub clip saved — open studio for full params' : 'Video queued');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-600">Video</p>
      <textarea
        className="min-h-[72px] flex-1 rounded border border-white/10 bg-black/30 p-2 text-[11px] text-zinc-100"
        placeholder="Shot description…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        type="button"
        onClick={() => void quickGenerate()}
        className="inline-flex items-center justify-center gap-1 rounded bg-amber-600/90 py-2 text-[11px] text-white"
      >
        <Sparkles size={12} />
        Generate
      </button>
      <button
        type="button"
        onClick={() => dispatchAgentNavigate({ toolId: 'video' })}
        className="rounded border border-white/10 py-1.5 text-[10px] text-zinc-400 hover:text-zinc-200"
      >
        Open production studio
      </button>
    </div>
  );
}