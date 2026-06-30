'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Mic, Send, X } from 'lucide-react';
import type {
  DesignAnnotation,
  DesignBridgeMessage,
  DesignContext,
  ElementContext,
} from '@/src/lib/design-mode';

type OverlayMode = 'select' | 'draw';
type Point = { x: number; y: number };
type QueuedEdit = { prompt: string; ctx: DesignContext };

/** Minimal Web Speech typing (not in lib.dom for all targets). */
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

/**
 * Wraps the preview iframe with a Cursor-style Design Mode layer: a toggle, live
 * selection chips, freehand draw annotations, voice dictation, screenshot
 * capture, and a floating prompt bar with a FIFO edit queue. Element capture
 * happens inside the iframe (public/design-mode.js, injected when ?design=1);
 * this component owns the toggle/UI and forwards assembled context to the agent.
 */
export type DesignModeOverlayHandle = {
  clearStrokes: () => void;
};

export const DesignModeOverlay = forwardRef<
  DesignModeOverlayHandle,
  {
    slug: string | null;
    /** Preview URL WITHOUT the ?design param. */
    previewUrl: string;
    previewKey: number;
    /** Resolves when the agent run finishes — used to drain the edit queue. */
    onSubmit: (prompt: string, ctx: DesignContext) => Promise<void>;
    busy: boolean;
    /** Controlled: whether Design Mode is on (toggled from the header). */
    enabled: boolean;
    /** Controlled: select vs draw mode (set from the header). */
    mode: OverlayMode;
    /** Notifies the parent when the freehand stroke state changes. */
    onStrokesChange?: (has: boolean) => void;
  }
>(function DesignModeOverlay(
  { slug, previewUrl, previewKey, onSubmit, busy, enabled, mode, onStrokesChange },
  ref,
) {
  const [selections, setSelections] = useState<ElementContext[]>([]);
  const [annotation, setAnnotation] = useState<DesignAnnotation | undefined>();
  const [pagePath, setPagePath] = useState('index.html');
  const [viewport, setViewport] = useState<{ w: number; h: number } | undefined>();
  const [prompt, setPrompt] = useState('');
  const [hasStrokes, setHasStrokes] = useState(false);
  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [queueLen, setQueueLen] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const drawingRef = useRef(false);
  const queueRef = useRef<QueuedEdit[]>([]);
  const drainingRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const promptBaseRef = useRef('');

  const voiceSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const src = enabled
    ? `${previewUrl}${previewUrl.includes('?') ? '&' : '?'}design=1`
    : previewUrl;

  // Reset everything when leaving design mode or switching project/preview.
  useEffect(() => {
    if (!enabled) {
      setSelections([]);
      setAnnotation(undefined);
      setPrompt('');
      clearStrokes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, slug, previewKey]);

  // ── Bridge messages from the iframe ─────────────────────────────────────────
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const data = e.data as DesignBridgeMessage;
      if (!data || typeof data !== 'object') return;
      switch (data.type) {
        case 'design:selection':
          setSelections(data.selections);
          setPagePath(data.pagePath);
          setViewport(data.viewport);
          break;
        case 'design:annotation':
          setAnnotation(data.annotation);
          break;
        case 'design:cleared':
          setSelections([]);
          setAnnotation(undefined);
          break;
        default:
          break;
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const postToIframe = useCallback((type: string) => {
    iframeRef.current?.contentWindow?.postMessage({ type }, window.location.origin);
  }, []);

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
    }
  }, []);

  const redrawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ff2d2d';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const stroke of strokesRef.current) {
      if (stroke.length < 1) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }, []);

  function clearStrokes() {
    strokesRef.current = [];
    setHasStrokes(false);
    onStrokesChange?.(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  useImperativeHandle(ref, () => ({ clearStrokes }), [onStrokesChange]);

  useEffect(() => {
    if (mode === 'draw') sizeCanvas();
  }, [mode, sizeCanvas]);

  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onCanvasDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    sizeCanvas();
    drawingRef.current = true;
    strokesRef.current.push([canvasPoint(e)]);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };
  const onCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const cur = strokesRef.current[strokesRef.current.length - 1];
    cur.push(canvasPoint(e));
    redrawStrokes();
  };
  const onCanvasUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const has = strokesRef.current.some((s) => s.length > 1);
    setHasStrokes(has);
    onStrokesChange?.(has);
  };

  // ── Selection helpers ───────────────────────────────────────────────────────
  const clearSelection = useCallback(() => {
    postToIframe('design:clear');
    setSelections([]);
    setAnnotation(undefined);
  }, [postToIframe]);

  const removeChip = useCallback((idx: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // ── Screenshot (best-effort, same-origin iframe) ────────────────────────────
  const captureScreenshot = useCallback(async (): Promise<string | undefined> => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return undefined;
    try {
      setCapturing(true);
      const html2canvas = (await import('html2canvas')).default;
      const w = iframe.clientWidth;
      const h = iframe.clientHeight;
      const shot = await html2canvas(doc.documentElement, {
        backgroundColor: '#ffffff',
        logging: false,
        scale: 1,
        x: doc.documentElement.scrollLeft || doc.body.scrollLeft || 0,
        y: doc.documentElement.scrollTop || doc.body.scrollTop || 0,
        width: w,
        height: h,
        windowWidth: doc.documentElement.scrollWidth,
        windowHeight: doc.documentElement.scrollHeight,
      });
      // Bake freehand strokes (canvas overlays the iframe 1:1 in CSS px).
      if (strokesRef.current.some((s) => s.length > 1)) {
        const ctx = shot.getContext('2d');
        if (ctx) {
          const sx = shot.width / w;
          const sy = shot.height / h;
          ctx.strokeStyle = '#ff2d2d';
          ctx.lineWidth = 3 * Math.max(sx, sy);
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          for (const stroke of strokesRef.current) {
            if (stroke.length < 1) continue;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x * sx, stroke[0].y * sy);
            for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x * sx, stroke[i].y * sy);
            ctx.stroke();
          }
        }
      }
      return shot.toDataURL('image/png');
    } catch {
      return undefined;
    } finally {
      setCapturing(false);
    }
  }, []);

  // ── Voice dictation ─────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (!voiceSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    promptBaseRef.current = prompt ? prompt.trim() + ' ' : '';
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].transcript;
      setPrompt(promptBaseRef.current + text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [voiceSupported, listening, prompt]);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  // ── Edit queue (FIFO, sequential) ───────────────────────────────────────────
  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        const next = queueRef.current.shift()!;
        setQueueLen(queueRef.current.length);
        try {
          await onSubmit(next.prompt, next.ctx);
        } catch {
          /* surfaced in chat */
        }
      }
    } finally {
      drainingRef.current = false;
    }
  }, [onSubmit]);

  const submit = useCallback(async () => {
    if (!prompt.trim() || selections.length === 0) return;
    const text = prompt.trim();
    const screenshotDataUrl = await captureScreenshot();
    const ctx: DesignContext = {
      pagePath,
      selections,
      annotation,
      viewport,
      screenshotDataUrl,
    };
    queueRef.current.push({ prompt: text, ctx });
    setQueueLen(queueRef.current.length);
    setPrompt('');
    clearSelection();
    clearStrokes();
    void drain();
  }, [prompt, selections, annotation, viewport, pagePath, captureScreenshot, clearSelection, drain]);

  if (!slug) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
        No project selected
      </div>
    );
  }

  const canSubmit = selections.length > 0 && prompt.trim().length > 0 && !capturing;

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={iframeRef}
        key={`${previewKey}-${enabled ? 'design' : 'plain'}`}
        src={src}
        title="preview"
        className="h-full w-full border-0 bg-white"
      />

      {/* Draw canvas overlay (interactive only in draw mode) */}
      {enabled && (
        <canvas
          ref={canvasRef}
          onPointerDown={onCanvasDown}
          onPointerMove={onCanvasMove}
          onPointerUp={onCanvasUp}
          onPointerLeave={onCanvasUp}
          className="absolute inset-0 z-[5] h-full w-full"
          style={{ pointerEvents: mode === 'draw' ? 'auto' : 'none', cursor: mode === 'draw' ? 'crosshair' : 'default' }}
        />
      )}

      {enabled && (
        <>
          {/* Hint / selection chips */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[55%] flex-wrap gap-1.5">
            {selections.length === 0 ? (
              <span className="pointer-events-auto rounded-md border border-[var(--color-border)] bg-[var(--color-panel)]/90 px-2 py-1 text-[11px] text-[var(--color-muted)] shadow-sm backdrop-blur">
                {mode === 'draw'
                  ? 'Draw to highlight what to change · the marks are sent with your prompt'
                  : 'Click an element · Shift/⌘-click to multi-select · Shift-drag to box · Esc to clear'}
              </span>
            ) : (
              selections.map((el, i) => (
                <span
                  key={i}
                  className="pointer-events-auto flex items-center gap-1 rounded-md border border-[var(--color-accent)] bg-[var(--color-panel)]/95 px-2 py-1 text-[11px] text-[var(--color-fg)] shadow-sm backdrop-blur"
                  title={el.cssSelector}
                >
                  <span className="font-mono">
                    {el.tagName}
                    {el.id ? `#${el.id}` : el.classList[0] ? `.${el.classList[0]}` : ''}
                  </span>
                  <button
                    onClick={() => removeChip(i)}
                    className="text-[var(--color-muted)] hover:text-[var(--color-fg)]"
                    title="Remove"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Floating prompt bar */}
          <div className="absolute bottom-4 left-1/2 z-10 w-[min(640px,90%)] -translate-x-1/2">
            <div className="flex items-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)]/95 p-2 shadow-lg backdrop-blur">
              <div className="flex min-w-0 flex-1 flex-col">
                {(selections.length > 0 || queueLen > 0 || hasStrokes) && (
                  <div className="flex items-center gap-2 px-1 pb-1 text-[10px] text-[var(--color-muted)]">
                    {selections.length > 0 && (
                      <span>
                        {selections.length} element{selections.length > 1 ? 's' : ''} on {pagePath}
                      </span>
                    )}
                    {hasStrokes && <span className="text-[#ff5a5a]">+ drawing</span>}
                    {queueLen > 0 && (
                      <span className="rounded bg-[var(--color-accent-soft)] px-1.5 py-0.5 text-[var(--color-fg)]">
                        {queueLen} queued
                      </span>
                    )}
                    {busy && <span>· agent working…</span>}
                  </div>
                )}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  rows={1}
                  placeholder={
                    selections.length === 0
                      ? 'Select an element to edit…'
                      : 'Describe the change (e.g. "make this button bigger and blue")'
                  }
                  disabled={selections.length === 0}
                  className="min-h-0 w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
                />
              </div>
              {voiceSupported && (
                <button
                  onClick={toggleVoice}
                  title={listening ? 'Stop dictation' : 'Dictate with voice'}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${
                    listening
                      ? 'border-[var(--color-danger)] bg-[var(--color-danger)]/15 text-[var(--color-danger)]'
                      : 'border-[var(--color-border)] bg-[var(--color-panel-2)] text-[var(--color-fg)] hover:bg-[var(--color-panel)]'
                  }`}
                >
                  <Mic size={15} className={listening ? 'animate-pulse' : ''} />
                </button>
              )}
              <button
                onClick={() => void submit()}
                disabled={!canSubmit}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent)] text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
                title={capturing ? 'Capturing…' : 'Send to agent'}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
