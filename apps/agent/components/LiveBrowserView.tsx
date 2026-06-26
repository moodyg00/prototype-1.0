"use client";

import React from 'react';
import { ViewState } from '../lib/operators/types';
import { Monitor, Globe, Code2, Smartphone, Play } from 'lucide-react';

interface LiveBrowserViewProps {
  view: ViewState;
  title?: string;
  onManualAction?: (action: string, payload?: any) => void;
  className?: string;
}

/**
 * LiveBrowserView — reusable live screenshot view for the visual browser operator.
 * Renders a desktop / browser / app frame with:
 * - Top chrome (title, url, LIVE badge)
 * - Inner content area that reflects current ViewState (mock UIs + text + screenshot if present)
 * - Optional action highlight overlay (red dot / rect for clicks)
 * - Status indicator
 *
 * This is the exact surface that will be driven by both Simulated and future Real operators.
 * Also reusable for Mobile (device frame variant) and Video agents (they "drive" editing canvases).
 */
export function LiveBrowserView({ view, title, onManualAction, className = '' }: LiveBrowserViewProps) {
  const kind = view.kind;
  const isLive = view.status !== 'idle';

  const FrameIcon = kind === 'mobile' ? Smartphone : kind === 'vscode' ? Code2 : kind === 'browser' ? Globe : Monitor;

  // Action highlight (normalized or absolute — we treat numbers < 2 as 0-1 fractions of the inner)
  const hl = view.highlight;
  const showHL = !!hl;

  const renderInner = () => {
    // If we have a real screenshot data url, show it with optional overlay
    if (view.screenshot) {
      return (
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <img src={view.screenshot} alt="live view" className="max-h-full max-w-full object-contain" />
          {showHL && <HighlightOverlay hl={hl} />}
        </div>
      );
    }

    if (kind === 'desktop') {
      return (
        <div className="w-full h-full bg-[#0b0b0d] flex flex-col items-center justify-center text-center p-8">
          <div className="text-7xl mb-6 opacity-40">🖥️</div>
          <div className="text-lg text-zinc-300">{view.title || 'Remote Desktop / Hybrid Sandbox'}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">1420×900 • connected</div>
          <div className="mt-6 text-[10px] text-zinc-500 max-w-[260px]">
            Agent has full vision + mouse/keyboard + browser tools. Actions appear here in real time.
          </div>
        </div>
      );
    }

    if (kind === 'browser') {
      const url = view.url || 'https://example.com';
      return (
        <div className="w-full h-full bg-white text-black flex flex-col">
          {/* Browser chrome */}
          <div className="h-8 bg-[#f1f1f3] border-b border-black/10 flex items-center px-2 gap-2 text-[11px]">
            <div className="flex gap-1.5 pl-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex-1 mx-3 bg-white rounded text-zinc-500 px-3 py-px border border-black/10 truncate font-mono text-[10px]">
              {url}
            </div>
          </div>

          {/* Page content (mock or textual) */}
          <div className="flex-1 p-4 overflow-auto bg-zinc-50 text-sm relative">
            {view.content ? (
              <div className="text-zinc-800 whitespace-pre-wrap font-mono text-xs leading-snug bg-white p-3 rounded border border-zinc-200">
                {view.content}
              </div>
            ) : (
              <div className="text-zinc-400">Page content area — real DOM or rendered screenshot appears here when operator provides it.</div>
            )}
            {showHL && <HighlightOverlay hl={hl} scale={1} />}
          </div>
        </div>
      );
    }

    if (kind === 'vscode') {
      return (
        <div className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] p-3 font-mono text-xs overflow-auto relative">
          <div className="text-[#6a9955] mb-1 text-[10px]">{view.title || 'settings.json — VS Code'}</div>
          <pre className="leading-tight opacity-90">{view.content || '{\n  "editor.wordWrap": "on"\n}'}</pre>
          {showHL && <HighlightOverlay hl={hl} />}
          <div className="absolute bottom-2 right-3 text-[10px] bg-black/60 px-1.5 py-px rounded text-emerald-400">word wrap enabled</div>
        </div>
      );
    }

    if (kind === 'mobile') {
      return (
        <div className="w-full h-full bg-black text-white/90 p-4 text-[11px] flex items-center justify-center">
          <div>
            <div className="text-center mb-2 opacity-60">iOS / Android Simulator</div>
            <div className="bg-zinc-900 rounded p-3 text-xs">{view.content || view.title || 'Home screen / App'}</div>
          </div>
          {showHL && <HighlightOverlay hl={hl} />}
        </div>
      );
    }

    // custom / fallback
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-xs text-zinc-400">
        {view.content || view.title || 'Live canvas'}
      </div>
    );
  };

  return (
    <div className={`card overflow-hidden flex flex-col ${className}`}>
      {/* Top chrome */}
      <div className="h-9 px-3 flex items-center gap-2 border-b border-white/10 bg-black/40 text-xs flex-shrink-0">
        <FrameIcon size={14} className="text-blue-400" />
        <div className="font-medium tracking-tight">{title || 'LIVE VIEW — HYBRID OPERATOR'}</div>
        <div className="ml-1 text-[10px] text-zinc-500">· {kind}</div>

        <div className="ml-auto flex items-center gap-2">
          <div className={`px-2 py-px rounded font-mono flex items-center gap-1.5 text-[10px] ${isLive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-zinc-500'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            {isLive ? 'LIVE' : 'IDLE'}
          </div>
          {view.status !== 'idle' && (
            <div className="text-[10px] uppercase tracking-widest text-amber-400/80">{view.status}</div>
          )}
        </div>
      </div>

      {/* The actual viewport */}
      <div className="relative flex-1 min-h-[260px] bg-black overflow-hidden" style={{ aspectRatio: kind === 'mobile' ? '9 / 16' : '16 / 10' }}>
        {renderInner()}
      </div>

      {/* Footer bar (optional manual controls for testing) */}
      {onManualAction && (
        <div className="px-2 py-1.5 border-t border-white/10 bg-black/30 flex gap-1.5 text-[10px]">
          <button onClick={() => onManualAction('click', { coords: [0.4, 0.5] })} className="btn btn-ghost !px-2 !py-0.5 text-[10px]">Sim click</button>
          <button onClick={() => onManualAction('screenshot')} className="btn btn-ghost !px-2 !py-0.5 text-[10px]">Capture</button>
        </div>
      )}
    </div>
  );
}

function HighlightOverlay({ hl, scale = 0.92 }: { hl?: { x: number; y: number; w?: number; h?: number }; scale?: number }) {
  if (!hl) return null;
  // Convert 0-1 normalized into % inside the container
  const left = `${(hl.x || 0.5) * 100 * scale}%`;
  const top = `${(hl.y || 0.5) * 100 * scale}%`;
  const w = hl.w ? `${hl.w * 100}%` : '28px';
  const h = hl.h ? `${hl.h * 100}%` : '28px';
  return (
    <div
      className="absolute pointer-events-none border-2 border-red-500/90 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.6)]"
      style={{
        left,
        top,
        width: w,
        height: h,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
    </div>
  );
}
