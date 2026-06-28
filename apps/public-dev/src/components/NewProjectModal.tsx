'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import type { ProjectMeta } from '@/src/lib/types';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

export function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: ProjectMeta) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name));
  }, [name, slugEdited]);

  const valid = /^[a-z0-9][a-z0-9-]{0,62}$/.test(slug) && name.trim().length > 0;

  const create = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      onCreated(data.project);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <Plus size={16} className="text-[var(--color-accent)]" />
          <h2 className="font-semibold">New project</h2>
          <button onClick={onClose} className="ml-auto text-[var(--color-muted)] hover:text-[var(--color-fg)]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3 p-4 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted)]">Project name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="Acme Landing"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-[var(--color-muted)]">
              URL slug <span className="font-mono">/sites/{slug || '…'}</span>
            </span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="acme-landing"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1.5 font-mono outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <p className="text-xs text-[var(--color-muted)]">
            Creates a starter <code>index.html</code>, <code>css/styles.css</code>, and{' '}
            <code>js/main.js</code>. Lowercase letters, numbers, and hyphens only.
          </p>
          {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] px-4 py-3">
          <button onClick={onClose} className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-panel-2)]">
            Cancel
          </button>
          <button
            onClick={create}
            disabled={!valid || saving}
            className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
          </button>
        </div>
      </div>
    </div>
  );
}
