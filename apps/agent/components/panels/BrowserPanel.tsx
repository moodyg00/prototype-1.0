"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Play, Square, RefreshCw, LogIn, Globe, Terminal, Trash2 } from 'lucide-react';

/**
 * Unified Browser tool. One canonical execution engine — fast CDP / accessibility
 * tree via the `agent-browser` CLI (lib/browser/pure-browser-engine.ts, /api/browser/*)
 * — plus a "Login" mode that opens a real headed Chrome window for manual
 * login/2FA capture and secure credential storage (the one capability the old
 * vision-based operator had that the CDP engine doesn't need for task execution).
 */
export type BrowserMode = 'task' | 'login';

type StatusResponse = { running?: boolean; lines?: string[] };
type LoginStatusResponse = {
  loginWindowOpen?: boolean;
  credentialRequired?: { domain: string; reason: 'missing' | 'invalid' } | null;
  startupError?: string | null;
};

export function BrowserPanel() {
  const [mode, setMode] = useState<BrowserMode>('task');

  const [task, setTask] = useState('go to google.com and search for OpenAI');
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const [loginWindowOpen, setLoginWindowOpen] = useState(false);
  const [credentialRequired, setCredentialRequired] = useState<{ domain: string; reason: 'missing' | 'invalid' } | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [loginUrl, setLoginUrl] = useState('https://');
  const [credDomain, setCredDomain] = useState('');
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');
  const [credSaving, setCredSaving] = useState(false);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  useEffect(() => {
    if (credentialRequired?.domain) setCredDomain(credentialRequired.domain);
  }, [credentialRequired]);

  useEffect(() => {
    if (credentialRequired?.domain) setMode('login');
  }, [credentialRequired]);

  // Task-run status polling.
  useEffect(() => {
    if (mode !== 'task' || !running) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch('/api/browser/status');
        if (res.ok) {
          const d = (await res.json()) as StatusResponse;
          if (d.lines) setLines(d.lines);
          if (d.running === false) setRunning(false);
        }
      } catch { /* hiccup */ }
      timer = setTimeout(poll, 800);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, [mode, running]);

  // Login-window / credential-request polling (also surfaces requests from background workflow runs).
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch('/api/browser/login-status');
        if (res.ok) {
          const data = (await res.json()) as LoginStatusResponse;
          if (typeof data.loginWindowOpen === 'boolean') setLoginWindowOpen(data.loginWindowOpen);
          if (data.credentialRequired !== undefined) setCredentialRequired(data.credentialRequired ?? null);
          if (data.startupError !== undefined) setStartupError(data.startupError ?? null);
        }
      } catch { /* hiccup */ }
      timer = setTimeout(poll, 1500);
    };
    poll();
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  const start = async () => {
    if (!task.trim()) { toast.error('Enter a task'); return; }
    setLines([]); setRunning(true);
    try {
      const res = await fetch('/api/browser/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task, url: url.trim() || undefined }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || 'Failed to start');
      }
      toast.success('Browser task started');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
      setRunning(false);
    }
  };

  const stop = async () => {
    try { await fetch('/api/browser/status', { method: 'POST' }); } catch { /* ignore */ }
    setRunning(false);
    toast.info('Stop requested');
  };

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
      const res = await fetch('/api/browser/login', {
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
      await fetch('/api/browser/login', { method: 'DELETE' });
      setLoginWindowOpen(false);
      toast.success('Session saved');
    } catch { toast.error('Failed to close'); }
  };

  const modeButton = (value: BrowserMode, label: string, Icon: typeof Terminal) => (
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
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-white/6 bg-black/30">
        {modeButton('task', 'Browser', Terminal)}
        {modeButton('login', 'Login', LogIn)}
        <span className="ml-auto text-[10px] text-zinc-600">
          {mode === 'task' && 'Fast CDP — accessibility tree, no vision cost'}
          {mode === 'login' && 'Session capture + credentials'}
        </span>
      </div>

      {startupError && mode === 'login' && (
        <div className="flex-shrink-0 flex items-start gap-2 px-3 py-2.5 bg-amber-950/60 border-b border-amber-800/50 text-amber-300 text-xs leading-relaxed">
          <span className="flex-shrink-0 mt-0.5 text-amber-400">⚠</span>
          <span className="flex-1">{startupError}</span>
          <button onClick={() => setStartupError(null)} className="flex-shrink-0 text-amber-600 hover:text-amber-300 ml-1">✕</button>
        </div>
      )}

      {mode === 'task' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 border-b border-white/6 p-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={task}
                onChange={e => setTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !running && start()}
                className="input flex-1 text-sm"
                placeholder="Describe the browser task..."
                disabled={running}
              />
              <button onClick={start} disabled={running} className="btn btn-primary flex items-center gap-1.5 text-xs">
                {running ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
                Run
              </button>
              {running && (
                <button onClick={stop} className="btn btn-ghost flex items-center gap-1.5 text-xs">
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
              <button onClick={() => setLines([])} className="btn btn-ghost !p-1.5" title="Clear">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div ref={logRef} className="flex-1 min-h-0 overflow-y-auto p-3 font-mono">
            {lines.length === 0 ? (
              <div className="text-[11px] text-zinc-600 text-center py-8">
                {running ? 'Starting...' : 'Output appears here'}
              </div>
            ) : (
              <div className="space-y-0.5">
                {lines.map((line, i) => (
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
            Browser
            {running && <span className="ml-2 text-amber-400 animate-pulse">running</span>}
          </div>
        </div>
      )}

      {mode === 'login' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 max-w-xl">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2">Login Browser</div>
            <p className="text-[11px] text-zinc-500 mb-3 leading-relaxed">
              Opens a visible Chrome window so you can log into any site manually. Sessions are saved to a persistent profile — all future task runs will already be authenticated.
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
        </div>
      )}
    </div>
  );
}
