'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, History, Loader2, Rocket, RotateCcw, X } from 'lucide-react';
import type { DeployPlan, DeployResult } from '@/src/lib/types';

type AuditEntry = {
  slug: string;
  target: string;
  uploaded: number;
  bytes: number;
  backupPath?: string;
  startedAt: string;
  finishedAt: string;
};

type Backup = { stamp: string; path: string };

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function DeployModal({
  slug,
  onClose,
  onDeployed,
}: {
  slug: string;
  onClose: () => void;
  onDeployed: () => void;
}) {
  const [plan, setPlan] = useState<DeployPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [backup, setBackup] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [rollingBack, setRollingBack] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${slug}/deploy/audit`);
      const data = await res.json();
      if (res.ok) {
        setAudit(data.entries ?? []);
        setBackups(data.backups ?? []);
      }
    } catch {
      /* non-fatal */
    }
  }, [slug]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const doRollback = async (stamp: string) => {
    if (!window.confirm(`Roll back the live site to backup ${stamp}? This overwrites the current live site.`)) {
      return;
    }
    setRollingBack(stamp);
    setDeployError(null);
    try {
      const res = await fetch(`/api/projects/${slug}/deploy/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stamp, confirm: 'ROLLBACK' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rollback failed');
      setResult(data.result);
      await loadHistory();
    } catch (err) {
      setDeployError((err as Error).message);
    } finally {
      setRollingBack(null);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingPlan(true);
      setPlanError(null);
      try {
        const res = await fetch(`/api/projects/${slug}/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'plan' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to build deploy plan');
        if (active) setPlan(data.plan);
      } catch (err) {
        if (active) setPlanError((err as Error).message);
      } finally {
        if (active) setLoadingPlan(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const canDeploy = confirmText.trim().toUpperCase() === 'DEPLOY' && !!plan && !deploying;

  const runDeploy = async () => {
    if (!canDeploy) return;
    setDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch(`/api/projects/${slug}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'execute', backup, confirm: 'DEPLOY' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deploy failed');
      setResult(data.result);
      onDeployed();
      loadHistory();
    } catch (err) {
      setDeployError((err as Error).message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Rocket size={16} className="text-[var(--color-accent)]" />
          <h2 className="font-semibold">Deploy “{slug}” to live</h2>
          <button onClick={onClose} className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-fg)]">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4 text-sm">
          {result ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[var(--color-ok)]">
                <CheckCircle2 size={18} /> <span className="font-medium">Deploy complete</span>
              </div>
              <ul className="space-y-1 text-[var(--color-muted)]">
                <li>Uploaded: <strong className="text-[var(--color-fg)]">{result.uploaded}</strong> files ({formatBytes(result.bytes)})</li>
                {result.backupPath && <li>Backup: <span className="font-mono text-xs">{result.backupPath}</span></li>}
                <li>Finished: {new Date(result.finishedAt).toLocaleString()}</li>
              </ul>
            </div>
          ) : loadingPlan ? (
            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <Loader2 size={15} className="animate-spin" /> Building dry-run plan…
            </div>
          ) : planError ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[var(--color-danger)]">
                <AlertTriangle size={16} /> <span className="font-medium">Cannot plan deploy</span>
              </div>
              <p className="text-[var(--color-muted)]">{planError}</p>
              <p className="text-xs text-[var(--color-muted)]">
                Check the <code>DEPLOY_LIVE_*</code> environment variables and SSH key access.
              </p>
            </div>
          ) : plan ? (
            <div className="space-y-3">
              <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-3 text-xs text-[var(--color-muted)]">
                <div>Target: <span className="text-[var(--color-fg)]">{plan.target}</span></div>
                <div>Host: <span className="text-[var(--color-fg)]">{plan.host}</span></div>
                <div>Remote docroot: <span className="font-mono text-[var(--color-fg)]">{plan.remoteDocroot}</span></div>
                <div className="mt-1">
                  {plan.files.length} item(s) · {formatBytes(plan.totalBytes)}
                  {plan.ignored.length > 0 && <> · {plan.ignored.length} ignored</>}
                </div>
              </div>
              <div className="max-h-56 overflow-auto rounded-md border border-[var(--color-border)]">
                <table className="w-full text-left font-mono text-xs">
                  <tbody>
                    {plan.files.map((f) => (
                      <tr key={f.path} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="px-2 py-1 text-[var(--color-muted)]">{f.action === 'create-dir' ? 'dir' : '+'}</td>
                        <td className="px-2 py-1">{f.path}</td>
                        <td className="px-2 py-1 text-right text-[var(--color-muted)]">{f.size != null ? formatBytes(f.size) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-[var(--color-fg)]">
                <input
                  type="checkbox"
                  checked={backup}
                  onChange={(e) => setBackup(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded-sm border-[var(--color-border)] bg-[var(--color-panel-2)]"
                />
                Create a backup of the current live docroot first (recommended)
              </label>

              <div className="rounded-md border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] p-3 text-xs text-[var(--color-fg)]">
                This overwrites the live site. Only continue if the site is tested and stable. Type
                <strong> DEPLOY </strong> to confirm.
              </div>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DEPLOY to confirm"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 outline-none focus:border-[var(--color-accent)]"
              />
              {deployError && <p className="text-xs text-[var(--color-danger)]">{deployError}</p>}
            </div>
          ) : null}

          {/* Deploy history + rollback */}
          <div className="mt-4 border-t border-[var(--color-border)] pt-3">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-1 text-xs uppercase tracking-wide text-[var(--color-muted)] hover:text-[var(--color-fg)]"
            >
              <History size={13} /> History & rollback ({audit.length})
            </button>
            {showHistory && (
              <div className="mt-2 space-y-3 text-xs">
                {backups.length > 0 && (
                  <div>
                    <div className="mb-1 text-[var(--color-muted)]">Backups</div>
                    <ul className="space-y-1">
                      {backups.map((b) => (
                        <li key={b.stamp} className="flex items-center gap-2">
                          <span className="font-mono">{b.stamp}</span>
                          <button
                            onClick={() => doRollback(b.stamp)}
                            disabled={rollingBack != null}
                            className="ml-auto flex items-center gap-1 rounded border border-[var(--color-border)] px-2 py-0.5 hover:bg-[var(--color-panel-2)] disabled:opacity-40"
                          >
                            {rollingBack === b.stamp ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                            Roll back
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {audit.length > 0 ? (
                  <div>
                    <div className="mb-1 text-[var(--color-muted)]">Deploys</div>
                    <ul className="space-y-1 text-[var(--color-muted)]">
                      {audit.map((e, i) => (
                        <li key={i} className="font-mono">
                          {new Date(e.finishedAt).toLocaleString()} · {e.target} · {e.uploaded} files
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-[var(--color-muted)]">No deploys yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel-2)]">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={runDeploy}
              disabled={!canDeploy}
              className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
            >
              {deploying ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />} Deploy now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
