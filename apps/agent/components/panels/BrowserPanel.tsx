"use client";

import React, { useState, useEffect, useRef } from 'react';
import { LiveBrowserView } from '../LiveBrowserView';
import { EventStream } from '../EventStream';
import { AgentEvent, ViewState } from '../../lib/operators/types';
import { toast } from 'sonner';
import { Play, Square, RefreshCw, X, LogIn, Globe, Eye, Terminal, Trash2 } from 'lucide-react';

type InferenceOverrides = Record<string, string | number | boolean>;

/**
 * Shared browser surface. Two execution backends behind one panel + tool button:
 *  - "visual"  → BrowserOperator (Playwright + xAI vision) via /api/visual-browser/*
 *  - "headless" → fast CDP / accessibility-tree agent via /api/pure-browser/*
 *  - "login"   → headed Chrome session capture + secure credential storage
 * The mode is explicit so cheap headless runs never pay the vision token cost,
 * and you can flip to visual only when you need to see what the agent sees.
 */
export type BrowserMode = 'visual' | 'headless' | 'login';

type BrowserStatusResponse = {
  view?: ViewState;
  capturedScreenshots?: Array<{ ts: number; dataUrl: string; label: string }>;
  events?: AgentEvent[];
  finalAnswer?: string | null;
  running?: boolean;
  loginWindowOpen?: boolean;
  credentialRequired?: { domain: string; reason: 'missing' | 'invalid' } | null;
  startupError?: string | null;
};

type PureStatusResponse = { running?: boolean; lines?: string[] };

const usePersistedState = <T,>(key: string, initial: T) => {
  const [state, setState] = useState<T>(initial);
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) { try { setState(JSON.parse(saved) as T); } catch { /* ignore */ } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const set = (v: T) => { setState(v); localStorage.setItem(key, JSON.stringify(v)); };
  return [state, set] as const;
};

export function BrowserPanel({ defaultMode = 'visual' }: { defaultMode?: BrowserMode } = {}) {
  const [mode, setMode] = useState<BrowserMode>(defaultMode);

  const [task, setTask] = useState('go to google.com and take a screenshot of the homepage');
  const [model] = usePersistedState<string>('aa-browser-model', '');
  const [persistedApiKey] = usePersistedState<string>('aa-browser-xai-key', '');
  const [oldPersistedApiKey] = usePersistedState<string>('aa-tars-xai-key', '');
  const effectivePersistedKey = persistedApiKey || oldPersistedApiKey;

  const [inferenceOverrides, setInferenceOverrides] = useState<InferenceOverrides>({});

  // ── Visual backend state ──────────────────────────────────────────────────
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [view, setView] = useState<ViewState>({ kind: 'browser', status: 'idle', title: 'Visual Browser' });
  const [running, setRunning] = useState(false);
  const [captured, setCaptured] = useState<Array<{ ts: number; dataUrl: string; label: string }>>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [modalScreenshot, setModalScreenshot] = useState<string | null>(null);
  const [loginWindowOpen, setLoginWindowOpen] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  // ── Headless backend state ────────────────────────────────────────────────
  const [pureUrl, setPureUrl] = useState('');
  const [pureRunning, setPureRunning] = useState(false);
  const [pureLines, setPureLines] = useState<string[]>([]);
  const pureLogRef = useRef<HTMLDivElement>(null);

  // ── Credential prompt state (shared, surfaced in Login mode) ───────────────
  const [credentialRequired, setCredentialRequired] = useState<{ domain: string; reason: 'missing' | 'invalid' } | null>(null);
  const [loginUrl, setLoginUrl] = useState('https://');
  const [credDomain, setCredDomain] = useState('');
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);

  useEffect(() => {
    if (credentialRequired?.domain) setCredDomain(credentialRequired.domain);
  }, [credentialRequired]);

  // A credential request from a background visual run should pull the user to Login mode.
  useEffect(() => {
    if (credentialRequired?.domain) setMode('login');
  }, [credentialRequired]);

  useEffect(() => {
    if (pureLogRef.current) pureLogRef.current.scrollTop = pureLogRef.current.scrollHeight;
  }, [pureLines]);

  // Visual / login status polling (also surfaces credential requests from background runs).
  useEffect(() => {
    if (mode === 'headless') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch('/api/visual-browser/status');
        if (res.ok) {
          const data = (await res.json()) as BrowserStatusResponse;
          if (data.view) setView(data.view);
          if (data.capturedScreenshots) setCaptured(data.capturedScreenshots);
          if (data.events) setEvents(data.events);
          if (data.finalAnswer) setFinalAnswer(data.finalAnswer);
          if (data.running === false) setRunning(false);
          if (typeof data.loginWindowOpen === 'boolean') setLoginWindowOpen(data.loginWindowOpen);
          if (data.credentialRequired !== undefined) setCredentialRequired(data.credentialRequired ?? null);
          if (data.startupError !== undefined) setStartupError(data.startupError ?? null);
        }
      } catch { /* hiccup */ }
      timer = setTimeout(poll, 1200);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, [mode]);

  // Headless status polling (only while a headless run is active).
  useEffect(() => {
    if (mode !== 'headless' || !pureRunning) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch('/api/pure-browser/status');
        if (res.ok) {
          const d = (await res.json()) as PureStatusResponse;
          if (d.lines) setPureLines(d.lines);
          if (d.running === false) setPureRunning(false);
        }
      } catch { /* hiccup */ }
      timer = setTimeout(poll, 800);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, [mode, pureRunning]);

  const startVisual = async () => {
    if (!task.trim()) { toast.error('Enter a task'); return; }
    setEvents([]); setCaptured([]); setFinalAnswer(null); setRunning(true);
    try {
      const res = await fetch('/api/visual-browser/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          task,
          apiKey: effectivePersistedKey || undefined,
          model: model || undefined,
          inferenceOverrides: Object.keys(inferenceOverrides).length ? inferenceOverrides : undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Failed to start');
      }
      toast.success('Visual browser started');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to start');
      setRunning(false);
    }
  };

  const stopVisual = async () => {
    try { await fetch('/api/visual-browser/status', { method: 'POST' }); } catch { /* ignore */ }
    setRunning(false);
    toast.info('Stop requested');
  };

  const startHeadless = async () => {
    if (!task.trim()) { toast.error('Enter a task'); return; }
    setPureLines([]); setPureRunning(true);
    try {
      const res = await fetch('/api/pure-browser/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task, url: pureUrl.trim() || undefined }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || 'Failed to start');
      }
      toast.success('Headless browser started');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
      setPureRunning(false);
    }
  };

  const stopHeadless = async () => {
    try { await fetch('/api/pure-browser/status', { method: 'POST' }); } catch { /* ignore */ }
    setPureRunning(false);
    toast.info('Stop requested');
  };

  const run = () => (mode === 'headless' ? startHeadless() : startVisual());
  const stop = () => (mode === 'headless' ? stopHeadless() : stopVisual());
  const isRunning = mode === 'headless' ? pureRunning : running;

  const saveCredentials = async () => {
    const domain = credDomain.trim() || (() => {
      try { return new URL(loginUrl).hostname; } catch { return ''; }
    })();
    if (!domain || !credUsername.trim() || !credPassword.trim()) {
      toast.error('Enter domain, username/email, and password');
      return;
    }
    setCredSaving(true);
    try {
      const res = await fetch('/api/secure/credentials', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ domain, username: credUsername, password: credPassword }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to save');
      toast.success(`Credentials saved for ${domain}`);
      setCredentialRequired(null);
      setCredDomain(domain);
      setCredUsername('');
      setCredPassword('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save credentials');
    } finally {
      setCredSaving(false);
    }
  };

  const openLoginBrowser = async () => {
    try {
      const res = await fetch('/api/visual-browser/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: loginUrl }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed');
      setLoginWindowOpen(true);
      toast.success('Login browser opened');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to open login browser');
    }
  };

  const closeLoginBrowser = async () => {
    try {
      await fetch('/api/visual-browser/login', { method: 'DELETE' });
      setLoginWindowOpen(false);
      toast.success('Session saved');
    } catch { toast.error('Failed to close'); }
  };

  const reconnectBrowser = async () => {
    try {
      await fetch('/api/visual-browser/status', { method: 'DELETE' });
      setStartupError(null);
      toast.success('Browser reset — run a task to reconnect to your real Chrome');
    } catch { toast.error('Failed to reset browser'); }
  };

  const modeButton = (value: BrowserMode, label: string, Icon: typeof Eye) => (
    <button
      onClick={() => setMode(value)}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded transition-colors ${
        mode === value ? 'bg-white/10 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon size={12} /> {label}
      {value === 'login' && loginWindowOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {value === 'login' && !!credentialRequired?.domain && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
    </button>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      {/* Mode toggle */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-white/6 bg-black/30">
        {modeButton('visual', 'Visual', Eye)}
        {modeButton('headless', 'Headless', Terminal)}
        {modeButton('login', 'Login', LogIn)}
        <span className="ml-auto text-[10px] text-zinc-600">
          {mode === 'visual' && 'Playwright + xAI vision'}
          {mode === 'headless' && 'Fast CDP — no vision cost'}
          {mode === 'login' && 'Session capture + credentials'}
        </span>
      </div>

      {startupError && mode !== 'headless' && (
        <div className="flex-shrink-0 flex items-start gap-2 px-3 py-2.5 bg-amber-950/60 border-b border-amber-800/50 text-amber-300 text-xs leading-relaxed">
          <span className="flex-shrink-0 mt-0.5 text-amber-400">⚠</span>
          <span className="flex-1">{startupError}</span>
          <button onClick={() => setStartupError(null)} className="flex-shrink-0 text-amber-600 hover:text-amber-300 ml-1">✕</button>
        </div>
      )}

      {/* ── Visual mode ──────────────────────────────────────────────────── */}
      {mode === 'visual' && (
        <div className="flex-1 min-h-0 grid grid-cols-[1fr_260px]">
          <div className="flex flex-col min-h-0 overflow-hidden border-r border-white/6">
            <div className="flex-1 min-h-0 overflow-hidden">
              <LiveBrowserView view={view} title="Live View" />
            </div>
            <div className="flex-shrink-0 border-t border-white/6 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={task}
                  onChange={e => setTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isRunning && run()}
                  className="input flex-1 text-sm"
                  placeholder="Describe the browser task..."
                  disabled={isRunning}
                />
                <button onClick={run} disabled={isRunning} className="btn btn-primary flex items-center gap-1.5 text-xs">
                  {isRunning ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
                  Run
                </button>
                {isRunning && (
                  <button onClick={stop} className="btn btn-ghost flex items-center gap-1.5 text-xs">
                    <Square size={13} /> Stop
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setInferenceOverrides({ reasoning_effort: 'high' })} className="btn btn-ghost !text-[10px] !py-0.5">High reasoning</button>
                <button onClick={() => setInferenceOverrides({ reasoning_effort: 'low' })} className="btn btn-ghost !text-[10px] !py-0.5">Low reasoning</button>
                <button onClick={() => setInferenceOverrides({})} className="btn btn-ghost !text-[10px] !py-0.5">Reset</button>
              </div>
            </div>
            <div className="flex-shrink-0 border-t border-white/6 p-3">
              <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Screenshots</div>
              {finalAnswer && (
                <div className="text-xs whitespace-pre-wrap bg-black/40 p-2 rounded mb-2 text-zinc-300">{finalAnswer}</div>
              )}
              {captured.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {captured.map((cap, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-28 border border-white/8 rounded overflow-hidden cursor-pointer hover:border-white/20 transition-colors"
                      onClick={() => setModalScreenshot(cap.dataUrl)}
                    >
                      <img src={cap.dataUrl} className="w-full h-16 object-cover" alt={cap.label} />
                      <div className="text-[9px] px-1.5 py-0.5 bg-black/70 text-zinc-500 truncate">{cap.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-zinc-600 py-3 text-center border border-dashed border-white/8 rounded">
                  {isRunning ? 'Running…' : 'Screenshots appear here'}
                </div>
              )}
            </div>
          </div>
          <div className="min-h-0 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-white/6 text-[10px] uppercase tracking-widest text-zinc-500">Events</div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <EventStream events={events} running={running} maxHeight="100%" />
            </div>
          </div>
        </div>
      )}

      {/* ── Headless mode ────────────────────────────────────────────────── */}
      {mode === 'headless' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 border-b border-white/6 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={task}
                onChange={e => setTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isRunning && run()}
                className="input flex-1 text-sm"
                placeholder="Describe the browser task..."
                disabled={isRunning}
              />
              <button onClick={run} disabled={isRunning} className="btn btn-primary flex items-center gap-1.5 text-xs">
                {isRunning ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
                Run
              </button>
              {isRunning && (
                <button onClick={stop} className="btn btn-ghost flex items-center gap-1.5 text-xs">
                  <Square size={13} /> Stop
                </button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <input
                value={pureUrl}
                onChange={e => setPureUrl(e.target.value)}
                className="input flex-1 text-xs"
                placeholder="Start URL (optional)"
                disabled={isRunning}
              />
              <button onClick={() => setPureLines([])} className="btn btn-ghost !p-1.5" title="Clear">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div ref={pureLogRef} className="flex-1 min-h-0 overflow-y-auto p-3 font-mono">
            {pureLines.length === 0 ? (
              <div className="text-[11px] text-zinc-600 text-center py-8">
                {isRunning ? 'Starting...' : 'Output appears here'}
              </div>
            ) : (
              <div className="space-y-0.5">
                {pureLines.map((line, i) => (
                  <div key={i} className={[
                    'text-[11px] leading-relaxed whitespace-pre-wrap break-all',
                    line.startsWith('[done]') ? 'text-emerald-400'
                      : line.startsWith('[error]') || line.startsWith('[err]')
                        ? 'text-red-400' : 'text-zinc-300',
                  ].join(' ')}>{line}</div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 border-t border-white/6 px-3 py-2 text-[10px] text-zinc-600">
            Headless Browser
            {isRunning && <span className="ml-2 text-amber-400 animate-pulse">running</span>}
          </div>
        </div>
      )}

      {/* ── Login mode ───────────────────────────────────────────────────── */}
      {mode === 'login' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 max-w-xl">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Login Browser</div>
            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
              Opens a visible Chrome window so you can log into any site manually. Sessions are saved to a persistent profile — all future runs (visual or headless) will already be authenticated.
            </p>
            {loginWindowOpen ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded p-2">
                  <Globe size={12} className="flex-shrink-0" />
                  Browser is open — log in, then click Done.
                </div>
                <button onClick={closeLoginBrowser} className="btn btn-primary w-full text-xs">
                  Done — Save Session
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={loginUrl}
                  onChange={e => setLoginUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && openLoginBrowser()}
                  className="input w-full text-xs"
                  placeholder="https://google.com"
                />
                <button onClick={openLoginBrowser} className="btn btn-primary w-full text-xs flex items-center justify-center gap-1.5">
                  <LogIn size={12} /> Open Login Browser
                </button>
              </div>
            )}
          </div>

          <div className="border border-white/8 rounded p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Credentials</div>
            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
              Save credentials directly to the database for browser login injection. They are never sent to any model — only injected at Playwright execution time on the server.
            </p>
            {!!credentialRequired?.domain && (
              <div className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded px-2 py-1.5 mb-2">
                Browser requested credentials for {credentialRequired.domain}.
              </div>
            )}
            <div className="space-y-2">
              <input
                value={credDomain}
                onChange={e => setCredDomain(e.target.value)}
                className="input w-full text-xs"
                placeholder="Domain (e.g. accounts.google.com)"
              />
              <input
                value={credUsername}
                onChange={e => setCredUsername(e.target.value)}
                className="input w-full text-xs"
                placeholder="Username or email"
              />
              <input
                value={credPassword}
                onChange={e => setCredPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveCredentials()}
                className="input w-full text-xs"
                placeholder="Password"
                type="password"
              />
              <button
                onClick={saveCredentials}
                disabled={credSaving || !credDomain.trim() || !credUsername.trim() || !credPassword.trim()}
                className="btn btn-primary w-full text-xs"
              >
                {credSaving ? 'Saving…' : 'Save Credentials'}
              </button>
            </div>
          </div>

          <div className="border border-white/8 rounded p-3">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Browser Connection</div>
            <p className="text-[11px] text-zinc-500 mb-2 leading-relaxed">
              Reconnects to your real Chrome (port 9222). Run this after launching Chrome with remote debugging so the agent uses your logged-in profile.
            </p>
            <button onClick={reconnectBrowser} className="btn btn-ghost w-full text-xs">
              Reconnect to Real Chrome
            </button>
          </div>
        </div>
      )}

      {modalScreenshot && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center"
          onClick={() => setModalScreenshot(null)}
        >
          <button
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            onClick={() => setModalScreenshot(null)}
          >
            <X size={20} />
          </button>
          <img
            src={modalScreenshot}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded border border-white/10"
            alt="Screenshot"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
