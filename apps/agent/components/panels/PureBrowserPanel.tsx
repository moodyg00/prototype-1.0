"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Play, Square, RefreshCw, Trash2 } from "lucide-react";

type SR = { running?: boolean; lines?: string[] };

export function PureBrowserPanel() {
  const [task, setTask] = useState(
    'go to google.com and search for OpenAI'
  );
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (running) {
      const poll = async () => {
        try {
          const res = await fetch("/api/pure-browser/status");
          if (res.ok) {
            const d = (await res.json()) as SR;
            if (d.lines) setLines(d.lines);
            if (d.running === false) setRunning(false);
          }
        } catch { /* hiccup */ }
        t = setTimeout(poll, 800);
      };
      poll();
    }
    return () => { if (t) clearTimeout(t); };
  }, [running]);

  const start = async () => {
    if (!task.trim()) { toast.error("Enter a task"); return; }
    setLines([]); setRunning(true);
    try {
      const res = await fetch("/api/pure-browser/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task,
          url: url.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as {error?: string};
        throw new Error(e.error || "Failed to start");
      }
      toast.success("Pure browser started");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg); setRunning(false);
    }
  };

  const stop = async () => {
    try {
      await fetch("/api/pure-browser/status", { method: "POST" });
    } catch { /* ignore */ }
    setRunning(false); toast.info("Stop requested");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      <div className="flex-shrink-0 border-b border-white/6 p-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={task}
            onChange={e => setTask(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !running && start()}
            className="input flex-1 text-sm"
            placeholder="Describe the browser task..."
            disabled={running}
          />
          <button onClick={start} disabled={running}
            className="btn btn-primary flex items-center gap-1.5 text-xs">
            {running ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
            Run
          </button>
          {running && (
            <button onClick={stop}
              className="btn btn-ghost flex items-center gap-1.5 text-xs">
              <Square size={13} /> Stop
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="input flex-1 text-xs"
            placeholder="Start URL (optional)"
            disabled={running}
          />
          <button onClick={() => setLines([])}
            className="btn btn-ghost !p-1.5" title="Clear">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div ref={logRef}
        className="flex-1 min-h-0 overflow-y-auto p-3 font-mono">
        {lines.length === 0 ? (
          <div className="text-[11px] text-zinc-600 text-center py-8">
            {running ? "Starting..." : "Output appears here"}
          </div>
        ) : (
          <div className="space-y-0.5">
            {lines.map((line, i) => (
              <div key={i} className={[
                "text-[11px] leading-relaxed whitespace-pre-wrap break-all",
                line.startsWith("[done]") ? "text-emerald-400"
                  : line.startsWith("[error]") || line.startsWith("[err]")
                    ? "text-red-400" : "text-zinc-300",
              ].join(" ")}>{line}</div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-white/6 px-3 py-2">
        <div className="text-[10px] text-zinc-600">
          Pure Browser
          {running && (
            <span className="ml-2 text-amber-400 animate-pulse">running</span>
          )}
        </div>
      </div>
    </div>
  );
}
