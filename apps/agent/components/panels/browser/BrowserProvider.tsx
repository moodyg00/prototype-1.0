'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

type StatusResponse = { running?: boolean; lines?: string[] };
type LoginStatusResponse = {
  loginWindowOpen?: boolean;
  credentialRequired?: { domain: string; reason: 'missing' | 'invalid' } | null;
  startupError?: string | null;
};

interface BrowserContextValue {
  task: string;
  setTask: (v: string) => void;
  url: string;
  setUrl: (v: string) => void;
  running: boolean;
  lines: string[];
  logRef: React.RefObject<HTMLDivElement | null>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  clearLines: () => void;
  loginWindowOpen: boolean;
  credentialRequired: { domain: string; reason: 'missing' | 'invalid' } | null;
  startupError: string | null;
  setStartupError: (v: string | null) => void;
  loginUrl: string;
  setLoginUrl: (v: string) => void;
  credDomain: string;
  setCredDomain: (v: string) => void;
  credUsername: string;
  setCredUsername: (v: string) => void;
  credPassword: string;
  setCredPassword: (v: string) => void;
  credSaving: boolean;
  saveCredentials: () => Promise<void>;
  openLoginBrowser: () => Promise<void>;
  closeLoginBrowser: () => Promise<void>;
}

const BrowserContext = createContext<BrowserContextValue | null>(null);

export function useBrowser(): BrowserContextValue {
  const ctx = useContext(BrowserContext);
  if (!ctx) throw new Error('useBrowser must be used within BrowserProvider');
  return ctx;
}

export function BrowserProvider({ children }: { children: React.ReactNode }) {
  const [task, setTask] = useState('go to google.com and search for OpenAI');
  const [url, setUrl] = useState('');
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const [loginWindowOpen, setLoginWindowOpen] = useState(false);
  const [credentialRequired, setCredentialRequired] = useState<{
    domain: string;
    reason: 'missing' | 'invalid';
  } | null>(null);
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
    if (!running) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch('/api/browser/status');
        if (res.ok) {
          const d = (await res.json()) as StatusResponse;
          if (d.lines) setLines(d.lines);
          if (d.running === false) setRunning(false);
        }
      } catch {
        /* hiccup */
      }
      timer = setTimeout(poll, 800);
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [running]);

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
      } catch {
        /* hiccup */
      }
      timer = setTimeout(poll, 1500);
    };
    poll();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const start = useCallback(async () => {
    if (!task.trim()) {
      toast.error('Enter a task');
      return;
    }
    setLines([]);
    setRunning(true);
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
  }, [task, url]);

  const stop = useCallback(async () => {
    try {
      await fetch('/api/browser/status', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setRunning(false);
    toast.info('Stop requested');
  }, []);

  const clearLines = useCallback(() => setLines([]), []);

  const saveCredentials = useCallback(async () => {
    const domain =
      credDomain.trim() ||
      (() => {
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
  }, [credDomain, credUsername, credPassword, loginUrl]);

  const openLoginBrowser = useCallback(async () => {
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
  }, [loginUrl]);

  const closeLoginBrowser = useCallback(async () => {
    try {
      await fetch('/api/browser/login', { method: 'DELETE' });
      setLoginWindowOpen(false);
      toast.success('Session saved');
    } catch {
      toast.error('Failed to close');
    }
  }, []);

  const value = useMemo(
    (): BrowserContextValue => ({
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
      loginWindowOpen,
      credentialRequired,
      startupError,
      setStartupError,
      loginUrl,
      setLoginUrl,
      credDomain,
      setCredDomain,
      credUsername,
      setCredUsername,
      credPassword,
      setCredPassword,
      credSaving,
      saveCredentials,
      openLoginBrowser,
      closeLoginBrowser,
    }),
    [
      task,
      url,
      running,
      lines,
      start,
      stop,
      clearLines,
      loginWindowOpen,
      credentialRequired,
      startupError,
      loginUrl,
      credDomain,
      credUsername,
      credPassword,
      credSaving,
      saveCredentials,
      openLoginBrowser,
      closeLoginBrowser,
    ],
  );

  return <BrowserContext.Provider value={value}>{children}</BrowserContext.Provider>;
}
