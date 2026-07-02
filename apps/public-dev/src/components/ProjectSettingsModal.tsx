'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, Plug, Settings, X } from 'lucide-react';
import type { ProjectMeta } from '@/src/lib/types';

type DeployForm = {
  host: string;
  port: string;
  user: string;
  sshKeyPath: string;
  docroot: string;
};

const EMPTY_DEPLOY: DeployForm = { host: '', port: '', user: '', sshKeyPath: '', docroot: '' };

export function ProjectSettingsModal({
  slug,
  onClose,
  onSaved,
}: {
  slug: string;
  onClose: () => void;
  onSaved: (project: ProjectMeta) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('live');
  const [deploy, setDeploy] = useState<DeployForm>(EMPTY_DEPLOY);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load project');
        if (!active) return;
        const p: ProjectMeta = data.project;
        setName(p.name);
        setDescription(p.description ?? '');
        setTarget(p.target || 'live');
        setDeploy({
          host: p.deploy?.host ?? '',
          port: p.deploy?.port ? String(p.deploy.port) : '',
          user: p.deploy?.user ?? '',
          sshKeyPath: p.deploy?.sshKeyPath ?? '',
          docroot: p.deploy?.docroot ?? '',
        });
      } catch (err) {
        if (active) setError((err as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const buildPayload = () => ({
    name: name.trim(),
    description: description.trim(),
    target,
    deploy: {
      host: deploy.host.trim() || undefined,
      port: deploy.port.trim() ? Number(deploy.port) : undefined,
      user: deploy.user.trim() || undefined,
      sshKeyPath: deploy.sshKeyPath.trim() || undefined,
      docroot: deploy.docroot.trim() || undefined,
    },
  });

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      onSaved(data.project);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Save current overrides first, then probe the connection so the test uses them.
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      await fetch(`/api/projects/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const res = await fetch(`/api/projects/${slug}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'test' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      const t = data.test;
      setTestResult(
        `Connected to ${t.host}. Docroot ${t.docroot} ${t.docrootExists ? 'exists.' : 'does NOT exist yet (it will be created on deploy).'}`,
      );
    } catch (err) {
      setTestError((err as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const field = (label: string, value: string, onChange: (v: string) => void, placeholder: string, mono = false) => (
    <label className="block">
      <span className="mb-1 block text-xs text-[var(--color-muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)] ${mono ? 'font-mono' : ''}`}
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Settings size={16} className="text-[var(--color-accent)]" />
          <h2 className="font-semibold">Project settings — {slug}</h2>
          <button onClick={onClose} className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-fg)]">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4 text-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-[var(--color-muted)]">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <h3 className="text-xs uppercase tracking-wide text-[var(--color-muted)]">General</h3>
                {field('Name', name, setName, 'Project name')}
                <label className="block">
                  <span className="mb-1 block text-xs text-[var(--color-muted)]">Description (optional)</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Short note about this site"
                    className="w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
                  />
                </label>
              </section>

              <section className="space-y-3">
                <h3 className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Deployment</h3>
                <label className="block">
                  <span className="mb-1 block text-xs text-[var(--color-muted)]">Target</span>
                  <div className="relative">
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full appearance-none rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] py-1.5 pl-2 pr-8 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                    >
                      <option value="live">live</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                    />
                  </div>
                </label>
                <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] p-2 text-xs text-[var(--color-muted)]">
                  Use host <strong>local</strong> to deploy to <code>apps/public-site/</code> (filesystem).
                  For production SFTP, set host, user, and docroot (<code>public_html</code>). Blank fields
                  inherit from <code>DEPLOY_LIVE_*</code> env. Passphrase stays in env only.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {field('Host', deploy.host, (v) => setDeploy((d) => ({ ...d, host: v })), 'local')}
                  {field('Port', deploy.port, (v) => setDeploy((d) => ({ ...d, port: v })), '22')}
                </div>
                {field('SSH user', deploy.user, (v) => setDeploy((d) => ({ ...d, user: v })), 'inherit from env')}
                {field('Private key path', deploy.sshKeyPath, (v) => setDeploy((d) => ({ ...d, sshKeyPath: v })), '~/.ssh/id_ed25519', true)}
                {field('Remote docroot', deploy.docroot, (v) => setDeploy((d) => ({ ...d, docroot: v })), 'default: apps/public-site', true)}

                <div className="flex items-center gap-2">
                  <button
                    onClick={testConnection}
                    disabled={testing}
                    className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-panel-2)] disabled:opacity-40"
                  >
                    {testing ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />} Test connection
                  </button>
                  {testResult && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-ok)]">
                      <CheckCircle2 size={12} /> {testResult}
                    </span>
                  )}
                </div>
                {testError && <p className="text-xs text-[var(--color-danger)]">{testError}</p>}
              </section>

              {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel-2)]">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || loading}
            className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />} Save settings
          </button>
        </div>
      </div>
    </div>
  );
}
