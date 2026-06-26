"use client";

import React, { useState, useEffect } from 'react';
import { LiveBrowserView } from '../LiveBrowserView';
import { EventStream } from '../EventStream';
import { AgentEvent, ViewState } from '../../lib/operators/types';
import { toast } from 'sonner';
import { Play, Square, RefreshCw, X, LogIn, Globe } from 'lucide-react';

type InferenceOverrides = Record<string, string | number | boolean>;

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

export function BrowserPanel() {
  const [task, setTask] = useState('go to google.com and take a screenshot of the homepage');
  const [model] = usePersistedState<string>('aa-browser-model', '');
  const [persistedApiKey] = usePersistedState<string>('aa-browser-xai-key', '');
  const [oldPersistedApiKey] = usePersistedState<string>('aa-tars-xai-key', '');
  const effectivePersistedKey = persistedApiKey || oldPersistedApiKey;

  const [inferenceOverrides, setInferenceOverrides] = useState<InferenceOverrides>({});
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [view, setView] = useState<ViewState>({ kind: 'browser', status: 'idle', title: 'Visual Browser' });
  const [running, setRunning] = useState(false);
  const [captured, setCaptured] = useState<Array<{ ts: number; dataUrl: string; label: string }>>([]);
  const [finalAnswer, setFinalAnswer] = useState<string | null>(null);
  const [modalScreenshot, setModalScreenshot] = useState<string | null>(null);

  const [sidebarTab, setSidebarTab] = useState<'events' | 'login'>('events');
  const [loginUrl, setLoginUrl] = useState('https://');
  const [loginWindowOpen, setLoginWindowOpen] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  // Credential prompt state
  const [credentialRequired, setCredentialRequired] = useState<{ domain: string; reason: 'missing' | 'invalid' } | null>(null);
  const [credDomain, setCredDomain] = useState('');
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);

  useEffect(() => {
    if (credentialRequired?.domain) setCredDomain(credentialRequired.domain);
  }, [credentialRequired]);

  useEffect(() => {
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
          if (data.credentialRequired !== undefined) {
            setCredentialRequired(data.credentialRequired ?? null);
          }
          if (data.startupError !== undefined) setStartupError(data.startupError ?? null);
        }
      } catch { /* hiccup */ }
      timer = setTimeout(poll, 1200);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  const startOperator = async () => {
    if (!task.trim()) { toast.error("Enter a task"); return; }
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
      toast.success('Browser operator started');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to start');
      setRunning(false);
    }
  };

  const stopOperator = async () => {
    try { await fetch('/api/visual-browser/status', { method: 'POST' }); } catch { /* ignore */ }
    setRunning(false);
    toast.info('Stop requested');
  };

  const saveCredentials = async () => {
    const domain = credDomain.trim() || (() => {
      try {
        return new URL(loginUrl).hostname;
      } catch {
        return '';
      }
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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#09090b]">
      {startupError && (
        <div className="flex-shrink-0 flex items-start gap-2 px-3 py-2.5 bg-amber-950/60 border-b border-amber-800/50 text-amber-300 text-xs leading-relaxed">
          <span className="flex-shrink-0 mt-0.5 text-amber-400">⚠</span>
          <span className="flex-1">{startupError}</span>
          <button onClick={() => setStartupError(null)} className="flex-shrink-0 text-amber-600 hover:text-amber-300 ml-1">✕</button>
        </div>
      )}
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
                onKeyDown={e => e.key === "Enter" && !running && startOperator()}
                className="input flex-1 text-sm"
                placeholder="Describe the browser task..."
                disabled={running}
              />
              <button onClick={startOperator} disabled={running} className="btn btn-primary flex items-center gap-1.5 text-xs">
                {running ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
                Run
              </button>
              {running && (
                <button onClick={stopOperator} className="btn btn-ghost flex items-center gap-1.5 text-xs">
                  <Square size={13} /> Stop
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => setInferenceOverrides({ reasoning_effort: "high" })} className="btn btn-ghost !text-[10px] !py-0.5">High reasoning</button>
              <button onClick={() => setInferenceOverrides({ reasoning_effort: "low" })} className="btn btn-ghost !text-[10px] !py-0.5">Low reasoning</button>
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
                {running ? "Running…" : "Screenshots appear here"}
              </div>
            )}
          </div>
        </div>
        <div className="min-h-0 overflow-hidden flex flex-col">
          <div className="flex border-b border-white/6 flex-shrink-0">
            <button
              onClick={() => setSidebarTab('events')}
              className={`flex-1 text-[10px] uppercase tracking-widest py-2 transition-colors ${sidebarTab === 'events' ? 'text-zinc-200 border-b border-white/20' : 'text-zinc-600 hover:text-zinc-400'}`}
            >Events</button>
            <button
              onClick={() => setSidebarTab('login')}
              className={`flex-1 text-[10px] uppercase tracking-widest py-2 transition-colors flex items-center justify-center gap-1 ${sidebarTab === 'login' ? 'text-zinc-200 border-b border-white/20' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              <LogIn size={10} />Login
              {loginWindowOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5" />}
            </button>
          </div>
          {sidebarTab === 'events' ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              <EventStream events={events} running={running} maxHeight="100%" />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Login Browser</div>
                <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
                  Opens a visible Chrome window so you can log into any site manually. Sessions are saved to a persistent profile — all future runs will already be authenticated.
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
                  Save credentials directly to the database for browser login injection.
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
        </div>
      </div>
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
