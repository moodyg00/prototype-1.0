'use client';

import { Play, RefreshCw, Square, Terminal, Trash2 } from 'lucide-react';

import { useBrowser } from '../BrowserProvider';

export function BrowserTaskView() {
  const {
    task,
    setTask,
    url,
    setUrl,
    running,
    lines,
    logRef,
    start,
    stop,
    clearLines,
  } = useBrowser();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#09090b]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/6 px-3 py-2">
        <Terminal size={13} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-200">Browser</span>
        <span className="ml-auto text-[10px] text-zinc-600">Fast CDP — accessibility tree, no vision cost</span>
      </div>

      <div className="shrink-0 space-y-2 border-b border-white/6 p-3">
        <div className="flex gap-2">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !running && void start()}
            className="input flex-1 text-sm"
            placeholder="Describe the browser task..."
            disabled={running}
          />
          <button
            type="button"
            onClick={() => void start()}
            disabled={running}
            className="btn btn-primary flex items-center gap-1.5 text-xs"
          >
            {running ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
            Run
          </button>
          {running ? (
            <button type="button" onClick={() => void stop()} className="btn btn-ghost flex items-center gap-1.5 text-xs">
              <Square size={13} /> Stop
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="input flex-1 text-xs"
            placeholder="Start URL (optional)"
            disabled={running}
          />
          <button type="button" onClick={clearLines} className="btn btn-ghost !p-1.5" title="Clear">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto p-3 font-mono">
        {lines.length === 0 ? (
          <div className="py-8 text-center text-[11px] text-zinc-600">
            {running ? 'Starting...' : 'Output appears here'}
          </div>
        ) : (
          <div className="space-y-0.5">
            {lines.map((line, i) => (
              <div
                key={i}
                className={[
                  'break-all text-[11px] leading-relaxed whitespace-pre-wrap',
                  line.startsWith('[done]')
                    ? 'text-emerald-400'
                    : line.startsWith('[error]') || line.startsWith('[err]')
                      ? 'text-red-400'
                      : 'text-zinc-300',
                ].join(' ')}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/6 px-3 py-2 text-[10px] text-zinc-600">
        Browser
        {running ? <span className="ml-2 animate-pulse text-amber-400">running</span> : null}
      </div>
    </div>
  );
}
