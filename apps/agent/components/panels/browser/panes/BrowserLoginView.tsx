'use client';

import { Globe, LogIn } from 'lucide-react';

import { useBrowser } from '../BrowserProvider';

export function BrowserLoginView() {
  const {
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
  } = useBrowser();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#09090b]">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/6 px-3 py-2">
        <LogIn size={13} className="text-zinc-400" />
        <span className="text-xs font-medium text-zinc-200">Login</span>
        {loginWindowOpen ? <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
        {credentialRequired?.domain ? <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-400" /> : null}
        <span className="ml-auto text-[10px] text-zinc-600">Session capture + credentials</span>
      </div>

      {startupError ? (
        <div className="flex shrink-0 items-start gap-2 border-b border-amber-800/50 bg-amber-950/60 px-3 py-2.5 text-xs leading-relaxed text-amber-300">
          <span className="mt-0.5 flex-shrink-0 text-amber-400">⚠</span>
          <span className="flex-1">{startupError}</span>
          <button type="button" onClick={() => setStartupError(null)} className="ml-1 flex-shrink-0 text-amber-600 hover:text-amber-300">
            ✕
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Login Browser</div>
          <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
            Opens a visible Chrome window so you can log into any site manually. Sessions are saved to a persistent profile — all
            future task runs will already be authenticated.
          </p>
          {loginWindowOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded border border-emerald-900/60 bg-emerald-950/40 p-2 text-xs text-emerald-400">
                <Globe size={12} className="flex-shrink-0" />
                Browser is open — log in, then click Done.
              </div>
              <button type="button" onClick={() => void closeLoginBrowser()} className="btn btn-primary w-full text-xs">
                Done — Save Session
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={loginUrl}
                onChange={(e) => setLoginUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void openLoginBrowser()}
                className="input w-full text-xs"
                placeholder="https://google.com"
              />
              <button
                type="button"
                onClick={() => void openLoginBrowser()}
                className="btn btn-primary flex w-full items-center justify-center gap-1.5 text-xs"
              >
                <LogIn size={12} /> Open Login Browser
              </button>
            </div>
          )}
        </div>

        <div className="rounded border border-white/8 p-3">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-zinc-600">Credentials</div>
          <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
            Save credentials directly to the database for browser login injection. They are never sent to any model — only injected
            at Playwright execution time on the server.
          </p>
          {credentialRequired?.domain ? (
            <div className="mb-2 rounded border border-amber-900/60 bg-amber-950/40 px-2 py-1.5 text-[11px] text-amber-300">
              Browser requested credentials for {credentialRequired.domain}.
            </div>
          ) : null}
          <div className="space-y-2">
            <input
              value={credDomain}
              onChange={(e) => setCredDomain(e.target.value)}
              className="input w-full text-xs"
              placeholder="Domain (e.g. accounts.google.com)"
            />
            <input
              value={credUsername}
              onChange={(e) => setCredUsername(e.target.value)}
              className="input w-full text-xs"
              placeholder="Username or email"
            />
            <input
              value={credPassword}
              onChange={(e) => setCredPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void saveCredentials()}
              className="input w-full text-xs"
              placeholder="Password"
              type="password"
            />
            <button
              type="button"
              onClick={() => void saveCredentials()}
              disabled={credSaving || !credDomain.trim() || !credUsername.trim() || !credPassword.trim()}
              className="btn btn-primary w-full text-xs"
            >
              {credSaving ? 'Saving…' : 'Save Credentials'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
