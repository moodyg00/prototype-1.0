'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Code2,
  File as FileIcon,
  FilePlus2,
  FileText,
  FolderPlus,
  Globe,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Settings,
  X,
} from 'lucide-react';
import type { FileNode, ProjectMeta } from '@/src/lib/types';
import { FileTree } from './FileTree';
import { AgentChat } from './AgentChat';
import { DeployModal } from './DeployModal';
import { NewProjectModal } from './NewProjectModal';
import { NewEntryModal } from './NewEntryModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { PaneZoomControls } from './PaneZoomControls';
import { usePaneZoom, usePaneZoomShortcuts } from '@/src/lib/usePaneZoom';

const PREVIEW_TAB = '__preview__';

function CodeLogo({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-5.76 -5.76 35.52 35.52"
      fill="none"
      className={className}
      aria-hidden
    >
      <g strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" strokeWidth={1.6}>
        <path d="M7 8L3 12L7 16" />
        <path d="M17 8L21 12L17 16" />
        <path d="M14 4L9.8589 19.4548" />
      </g>
    </svg>
  );
}

function extOf(p: string): string {
  return p.split('.').pop()?.toLowerCase() ?? '';
}

function languageForPath(p: string): string {
  switch (extOf(p)) {
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'mjs':
      return 'javascript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'svg':
    case 'xml':
      return 'xml';
    default:
      return 'plaintext';
  }
}

const TEXT_EXTS = new Set(['html', 'htm', 'css', 'js', 'mjs', 'json', 'md', 'txt', 'xml', 'webmanifest']);
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif', 'bmp']);

type TabKind = 'text' | 'image' | 'binary';

type FileState = {
  kind: TabKind;
  content: string;
  original: string;
  loading: boolean;
  /** svg can be flipped to a text editor view */
  asText?: boolean;
};

function defaultKind(path: string): TabKind {
  const ext = extOf(path);
  if (TEXT_EXTS.has(ext)) return 'text';
  if (IMAGE_EXTS.has(ext)) return 'image';
  return 'binary';
}

export function Ide({ initialProjects }: { initialProjects: ProjectMeta[] }) {
  const [projects, setProjects] = useState<ProjectMeta[]>(initialProjects);
  const [slug, setSlug] = useState<string | null>(initialProjects[0]?.slug ?? null);
  const [tree, setTree] = useState<FileNode[]>([]);

  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string>(PREVIEW_TAB);
  const [files, setFiles] = useState<Record<string, FileState>>({});

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [showDeploy, setShowDeploy] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newEntryKind, setNewEntryKind] = useState<'file' | 'dir' | null>(null);

  const filesRef = useRef(files);
  filesRef.current = files;

  const editorPaneRef = useRef<HTMLElement>(null);
  const editorZoom = usePaneZoom('editor', 13);
  usePaneZoomShortcuts(editorPaneRef, editorZoom);

  const activeFile = active !== PREVIEW_TAB ? files[active] : undefined;
  const activeIsText = activeFile?.kind === 'text' || (activeFile?.kind === 'image' && activeFile.asText);
  const dirty = !!activeFile && activeIsText && activeFile.content !== activeFile.original;

  const flash = useCallback((msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(null), 2500);
  }, []);

  const refreshTree = useCallback(async (s: string) => {
    const res = await fetch(`/api/projects/${s}/files`);
    if (!res.ok) return;
    const data = await res.json();
    setTree(data.tree ?? []);
  }, []);

  useEffect(() => {
    if (!slug) return;
    setOpenTabs([]);
    setFiles({});
    setActive(PREVIEW_TAB);
    refreshTree(slug);
  }, [slug, refreshTree]);

  const loadText = useCallback(
    async (path: string) => {
      if (!slug) return;
      setFiles((prev) => ({ ...prev, [path]: { ...prev[path], loading: true } as FileState }));
      try {
        const res = await fetch(`/api/projects/${slug}/file?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to read file');
        setFiles((prev) => ({
          ...prev,
          [path]: { ...(prev[path] as FileState), content: data.content, original: data.content, loading: false },
        }));
      } catch (err) {
        flash((err as Error).message);
        setFiles((prev) => ({ ...prev, [path]: { ...prev[path], loading: false } as FileState }));
      }
    },
    [slug, flash],
  );

  const openFile = useCallback(
    (path: string) => {
      setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
      setActive(path);
      const existing = filesRef.current[path];
      const kind = defaultKind(path);
      if (!existing) {
        setFiles((prev) => ({
          ...prev,
          [path]: { kind, content: '', original: '', loading: kind === 'text' },
        }));
        if (kind === 'text') loadText(path);
      }
    },
    [loadText],
  );

  const closeTab = useCallback(
    (path: string) => {
      setOpenTabs((prev) => {
        const next = prev.filter((p) => p !== path);
        setActive((cur) => (cur === path ? next[next.length - 1] ?? PREVIEW_TAB : cur));
        return next;
      });
      setFiles((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    },
    [],
  );

  const editAsText = useCallback(
    (path: string) => {
      setFiles((prev) => ({ ...prev, [path]: { ...(prev[path] as FileState), asText: true, loading: true } }));
      loadText(path);
    },
    [loadText],
  );

  const onEditorChange = useCallback((path: string, value: string) => {
    setFiles((prev) => ({ ...prev, [path]: { ...(prev[path] as FileState), content: value } }));
  }, []);

  const save = useCallback(async () => {
    if (!slug || active === PREVIEW_TAB) return;
    const state = filesRef.current[active];
    if (!state || (state.kind !== 'text' && !state.asText)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${slug}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: active, content: state.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setFiles((prev) => ({ ...prev, [active]: { ...(prev[active] as FileState), original: state.content } }));
      flash(`Saved ${active}`);
      setPreviewKey((k) => k + 1);
    } catch (err) {
      flash((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [slug, active, flash]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);

  const handleProjectCreated = useCallback(
    (project: ProjectMeta) => {
      setProjects((prev) => [...prev, project].sort((a, b) => a.name.localeCompare(b.name)));
      setSlug(project.slug);
      setShowNewProject(false);
      flash(`Created ${project.slug}`);
    },
    [flash],
  );

  const handleProjectSaved = useCallback(
    (project: ProjectMeta) => {
      setProjects((prev) =>
        prev.map((p) => (p.slug === project.slug ? project : p)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setShowSettings(false);
      flash('Settings saved');
    },
    [flash],
  );

  const createEntry = useCallback(
    async (path: string) => {
      if (!slug || !newEntryKind) throw new Error('No project selected');
      const res = await fetch(`/api/projects/${slug}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, kind: newEntryKind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');
      await refreshTree(slug);
      if (newEntryKind === 'file') openFile(data.path ?? path);
      flash(`Created ${data.path ?? path}`);
    },
    [slug, newEntryKind, refreshTree, openFile, flash],
  );

  const deleteEntry = useCallback(
    async (path: string) => {
      if (!slug) return;
      if (!window.confirm(`Delete "${path}"? This cannot be undone.`)) return;
      const res = await fetch(`/api/projects/${slug}/file?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        flash(data.error || 'Delete failed');
        return;
      }
      // Close any open tabs under the deleted path.
      openTabs.filter((p) => p === path || p.startsWith(path + '/')).forEach(closeTab);
      await refreshTree(slug);
      flash(`Deleted ${path}`);
    },
    [slug, openTabs, closeTab, refreshTree, flash],
  );

  const previewUrl = slug ? `/preview/${slug}/index.html` : 'about:blank';

  const tabIcon = (path: string) => {
    const k = files[path]?.kind ?? defaultKind(path);
    if (k === 'image' && !files[path]?.asText) return <ImageIcon size={13} />;
    if (k === 'binary') return <FileIcon size={13} />;
    return <Code2 size={13} />;
  };

  const tabName = (path: string) => path.split('/').pop() || path;

  const orderedTabs = useMemo(() => openTabs, [openTabs]);

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2">
        <div className="flex items-center gap-2 font-normal">
          <CodeLogo className="text-[var(--color-accent)]" />
          <span className="tracking-tight">Dev</span>
        </div>
        <div className="mx-1 h-5 w-px bg-[var(--color-border)]" />
        <select
          value={slug ?? ''}
          onChange={(e) => setSlug(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)]"
        >
          {projects.length === 0 && <option value="">No projects</option>}
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} ({p.slug})
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-sm hover:bg-[var(--color-panel-2)]"
        >
          <Plus size={14} /> New project
        </button>
        <button
          onClick={() => setShowSettings(true)}
          disabled={!slug}
          title="Project settings (name, deploy config)"
          className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-sm hover:bg-[var(--color-panel-2)] disabled:opacity-40"
        >
          <Settings size={14} /> Settings
        </button>

        <div className="ml-auto flex items-center gap-2">
          {status && <span className="text-xs text-[var(--color-muted)]">{status}</span>}
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-sm hover:bg-[var(--color-panel-2)]"
          >
            <Globe size={14} /> Open in new tab
          </a>
          <button
            onClick={() => setShowDeploy(true)}
            disabled={!slug}
            className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1 text-sm font-medium text-[var(--color-accent-fg)] hover:opacity-90 disabled:opacity-40"
          >
            <Rocket size={14} /> Deploy
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* File tree */}
        <aside className="flex w-60 flex-col border-r border-[var(--color-border)] bg-[var(--color-panel)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2 text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <span>Files</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="New file"
                disabled={!slug}
                onClick={() => setNewEntryKind('file')}
                className="hover:text-[var(--color-fg)] disabled:opacity-40"
              >
                <FilePlus2 size={14} />
              </button>
              <button
                type="button"
                title="New folder"
                disabled={!slug}
                onClick={() => setNewEntryKind('dir')}
                className="hover:text-[var(--color-fg)] disabled:opacity-40"
              >
                <FolderPlus size={14} />
              </button>
              <button
                type="button"
                title="Refresh"
                disabled={!slug}
                onClick={() => slug && refreshTree(slug)}
                className="hover:text-[var(--color-fg)] disabled:opacity-40"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <FileTree tree={tree} activePath={active === PREVIEW_TAB ? null : active} onOpen={openFile} onDelete={deleteEntry} />
          </div>
        </aside>

        {/* Center: tab bar + content */}
        <main ref={editorPaneRef} className="flex min-w-0 flex-1 flex-col">
          {/* Tab strip */}
          <div className="flex items-stretch overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-panel)] text-sm">
            {/* Preview tab (pinned) */}
            <button
              onClick={() => setActive(PREVIEW_TAB)}
              className={`flex shrink-0 items-center gap-1.5 border-r border-[var(--color-border)] px-3 py-2 ${
                active === PREVIEW_TAB
                  ? 'bg-[var(--color-bg)] text-[var(--color-fg)]'
                  : 'text-[var(--color-muted)] hover:bg-[var(--color-panel-2)]'
              }`}
              title="Live preview"
            >
              <Globe size={13} className="text-[var(--color-accent)]" /> Preview
            </button>
            {orderedTabs.map((path) => {
              const isActive = active === path;
              const isDirty = files[path] && (files[path].kind === 'text' || files[path].asText)
                && files[path].content !== files[path].original;
              return (
                <div
                  key={path}
                  onClick={() => setActive(path)}
                  className={`group flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-[var(--color-border)] px-3 py-2 ${
                    isActive
                      ? 'bg-[var(--color-bg)] text-[var(--color-fg)]'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-panel-2)]'
                  }`}
                  title={path}
                >
                  {tabIcon(path)}
                  <span className="max-w-[160px] truncate">{tabName(path)}</span>
                  {isDirty ? (
                    <span className="text-[var(--color-accent)]" aria-label="unsaved">●</span>
                  ) : null}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(path);
                    }}
                    className="ml-0.5 rounded p-0.5 text-[var(--color-muted)] opacity-0 hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)] group-hover:opacity-100"
                    title="Close"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
            {/* Save button at far right of strip */}
            <div className="ml-auto flex shrink-0 items-center gap-2 px-2">
              <PaneZoomControls
                value={editorZoom.size}
                defaultValue={editorZoom.defaultSize}
                min={editorZoom.min}
                max={editorZoom.max}
                onZoomIn={editorZoom.zoomIn}
                onZoomOut={editorZoom.zoomOut}
                onReset={editorZoom.reset}
                title="Editor font size"
              />
            {active !== PREVIEW_TAB && (
              <button
                onClick={save}
                disabled={!dirty || saving}
                className="flex shrink-0 items-center gap-1 px-1 py-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)] disabled:opacity-40"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
              </button>
            )}
            </div>
          </div>

          {/* Content area */}
          <div className="min-h-0 flex-1">
            {active === PREVIEW_TAB ? (
              slug ? (
                <iframe key={previewKey} src={previewUrl} title="preview" className="h-full w-full border-0 bg-white" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">No project selected</div>
              )
            ) : activeFile ? (
              activeFile.loading ? (
                <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                  <Loader2 size={15} className="mr-2 animate-spin" /> Loading…
                </div>
              ) : activeFile.kind === 'image' && !activeFile.asText ? (
                <ImageViewer slug={slug!} path={active} onEditAsText={extOf(active) === 'svg' ? () => editAsText(active) : undefined} />
              ) : activeFile.kind === 'binary' ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
                  <FileIcon size={28} />
                  <div>{tabName(active)}</div>
                  <div className="text-xs">This file type can&apos;t be shown. Open it in the preview tab instead.</div>
                </div>
              ) : (
                <Editor
                  height="100%"
                  theme="vs-dark"
                  path={active}
                  language={languageForPath(active)}
                  value={activeFile.content}
                  onChange={(v) => onEditorChange(active, v ?? '')}
                  loading={<div className="p-4 text-sm text-[var(--color-muted)]">Loading editor…</div>}
                  options={{
                    fontSize: editorZoom.size,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    automaticLayout: true,
                  }}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                Select a file from the tree to open it in a tab
              </div>
            )}
          </div>
        </main>

        {/* Agent chat */}
        <aside className="flex w-96 flex-col border-l border-[var(--color-border)] bg-[var(--color-panel)]">
          <AgentChat
            slug={slug}
            onFilesChanged={() => {
              if (slug) refreshTree(slug);
              setPreviewKey((k) => k + 1);
              // reload any open text tabs from disk
              openTabs.forEach((p) => {
                if (files[p]?.kind === 'text' || files[p]?.asText) loadText(p);
              });
            }}
            onRequestDeploy={() => setShowDeploy(true)}
          />
        </aside>
      </div>

      {showDeploy && slug && (
        <DeployModal slug={slug} onClose={() => setShowDeploy(false)} onDeployed={() => flash('Deploy complete')} />
      )}
      {showNewProject && (
        <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={handleProjectCreated} />
      )}
      {showSettings && slug && (
        <ProjectSettingsModal slug={slug} onClose={() => setShowSettings(false)} onSaved={handleProjectSaved} />
      )}
      {newEntryKind && slug && (
        <NewEntryModal
          kind={newEntryKind}
          onClose={() => setNewEntryKind(null)}
          onCreate={createEntry}
        />
      )}
    </div>
  );
}

function ImageViewer({
  slug,
  path,
  onEditAsText,
}: {
  slug: string;
  path: string;
  onEditAsText?: () => void;
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const src = `/preview/${slug}/${path.split('/').map(encodeURIComponent).join('/')}`;
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
        <FileText size={13} />
        <span>{path}</span>
        {dims && <span>· {dims.w}×{dims.h}px</span>}
        {onEditAsText && (
          <button onClick={onEditAsText} className="ml-auto flex items-center gap-1 rounded border border-[var(--color-border)] px-2 py-0.5 hover:bg-[var(--color-panel-2)]">
            <Code2 size={12} /> Edit as text
          </button>
        )}
      </div>
      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-6"
        style={{
          backgroundColor: '#1a1d22',
          backgroundImage:
            'linear-gradient(45deg, #22262c 25%, transparent 25%), linear-gradient(-45deg, #22262c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #22262c 75%), linear-gradient(-45deg, transparent 75%, #22262c 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={path}
          onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          className="max-h-full max-w-full object-contain shadow-lg"
        />
      </div>
    </div>
  );
}
