'use client';

import { Sparkles } from 'lucide-react';
import type { PaneRenderContext } from '@/lib/pane-types';
import { usePhotography } from '../PhotographyProvider';

export function QuickGenPane({ context: _context }: { context: PaneRenderContext }) {
  const {
    prompt,
    setPrompt,
    negative,
    setNegative,
    aspect,
    setAspect,
    refUrl,
    generating,
    generate,
  } = usePhotography();

  return (
    <div className="flex h-full flex-col gap-2 overflow-auto p-3">
      <div className="flex flex-wrap gap-2">
        {['1:1', '16:9', '9:16', '3:2'].map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAspect(a)}
            className={`rounded px-2 py-1 text-[10px] ${
              aspect === a ? 'bg-violet-600/80 text-white' : 'bg-white/5 text-zinc-400'
            }`}
          >
            {a}
          </button>
        ))}
      </div>
      <textarea
        className="min-h-[72px] w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[12px] text-zinc-100 outline-none focus:border-violet-500/40"
        placeholder="Describe the image…"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <input
        className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] text-zinc-400"
        placeholder="Negative prompt (optional)"
        value={negative}
        onChange={(e) => setNegative(e.target.value)}
      />
      {refUrl ? (
        <div className="text-[10px] text-zinc-500">
          Reference:
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={refUrl} alt="" className="mt-1 h-16 rounded border border-white/10" />
        </div>
      ) : null}
      <button
        type="button"
        disabled={generating}
        onClick={() => void generate()}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2 text-[12px] font-medium text-white hover:bg-violet-500 disabled:opacity-50"
      >
        <Sparkles size={14} />
        {generating ? 'Generating…' : 'Generate'}
      </button>
    </div>
  );
}
