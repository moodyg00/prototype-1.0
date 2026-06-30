'use client';

import { useCallback, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  Folder,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import type { FileNode } from '@/src/lib/types';
import { FileContextMenu, type ContextMenuState } from './FileContextMenu';

const DND_MIME = 'application/x-public-dev-path';

function isDescendantOrSelf(ancestor: string, candidate: string): boolean {
  const a = ancestor.replace(/^\/+|\/+$/g, '');
  const c = candidate.replace(/^\/+|\/+$/g, '');
  if (!a) return true;
  return c === a || c.startsWith(`${a}/`);
}

function NodeRow({
  node,
  depth,
  activePath,
  selectedDir,
  dropTarget,
  expanded,
  onOpen,
  onDelete,
  onSelectDir,
  onMove,
  onContextMenu,
  onToggleExpanded,
  onDropTarget,
}: {
  node: FileNode;
  depth: number;
  activePath: string | null;
  selectedDir: string | null;
  dropTarget: string | null;
  expanded: Set<string>;
  onOpen: (path: string) => void;
  onDelete: (path: string) => void;
  onSelectDir: (path: string | null) => void;
  onMove: (from: string, to: string) => void;
  onContextMenu: (menu: ContextMenuState) => void;
  onToggleExpanded: (path: string, open: boolean) => void;
  onDropTarget: (path: string | null) => void;
}) {
  const open = expanded.has(node.path);
  const pad = { paddingLeft: `${depth * 12 + 8}px` };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DND_MIME, JSON.stringify({ path: node.path, type: node.type }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDirDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    onDropTarget(node.path);
  };

  const handleDirDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDropTarget(null);
    let payload: { path: string };
    try {
      payload = JSON.parse(e.dataTransfer.getData(DND_MIME));
    } catch {
      return;
    }
    if (!payload.path || payload.path === node.path) return;
    if (isDescendantOrSelf(payload.path, node.path)) return;
    const baseName = payload.path.split('/').pop() ?? payload.path;
    onMove(payload.path, node.path ? `${node.path}/${baseName}` : baseName);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  if (node.type === 'dir') {
    const isSelected = selectedDir === node.path;
    const isDrop = dropTarget === node.path;
    return (
      <div>
        <div
          draggable
          onDragStart={handleDragStart}
          onDragOver={handleDirDragOver}
          onDragLeave={() => onDropTarget(null)}
          onDrop={handleDirDrop}
          onContextMenu={handleContextMenu}
          className={`group flex cursor-pointer select-none items-center gap-1 py-1 pr-2 text-sm text-[var(--color-fg)] hover:bg-[var(--color-panel-2)] ${
            isSelected ? 'bg-[var(--color-accent-soft)]' : ''
          } ${isDrop ? 'bg-[var(--color-accent-soft)] ring-1 ring-inset ring-[var(--color-accent)]' : ''}`}
          style={pad}
          onClick={() => {
            onSelectDir(node.path);
            onToggleExpanded(node.path, !open);
          }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? (
            <FolderOpen size={14} className="text-[var(--color-accent)]" />
          ) : (
            <Folder size={14} className="text-[var(--color-accent)]" />
          )}
          <span className="truncate">{node.name}</span>
          <button
            className="ml-auto text-[var(--color-muted)] opacity-0 hover:text-[var(--color-danger)] group-hover:opacity-100"
            title="Delete folder"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.path);
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
        {open &&
          node.children?.map((child) => (
            <NodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              selectedDir={selectedDir}
              dropTarget={dropTarget}
              expanded={expanded}
              onOpen={onOpen}
              onDelete={onDelete}
              onSelectDir={onSelectDir}
              onMove={onMove}
              onContextMenu={onContextMenu}
              onToggleExpanded={onToggleExpanded}
              onDropTarget={onDropTarget}
            />
          ))}
      </div>
    );
  }

  const isActive = activePath === node.path;
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onContextMenu={handleContextMenu}
      className={`group flex cursor-pointer select-none items-center gap-1 py-1 pr-2 text-sm ${
        isActive
          ? 'bg-[var(--color-accent-soft)] text-[var(--color-fg)]'
          : 'text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)]'
      }`}
      style={{ paddingLeft: `${depth * 12 + 26}px` }}
      onClick={() => onOpen(node.path)}
    >
      <FileIcon size={14} />
      <span className="truncate">{node.name}</span>
      <button
        className="ml-auto text-[var(--color-muted)] opacity-0 hover:text-[var(--color-danger)] group-hover:opacity-100"
        title="Delete file"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(node.path);
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export function FileTree({
  tree,
  activePath,
  selectedDir,
  onOpen,
  onDelete,
  onSelectDir,
  onMove,
  onCopyPath,
  onDuplicate,
  onAddFile,
  onAddFolder,
}: {
  tree: FileNode[];
  activePath: string | null;
  selectedDir: string | null;
  onOpen: (path: string) => void;
  onDelete: (path: string) => void;
  onSelectDir: (path: string | null) => void;
  onMove: (from: string, to: string) => void;
  onCopyPath: (path: string) => void;
  onDuplicate: (path: string) => void;
  onAddFile: (dirPath: string) => void;
  onAddFolder: (dirPath: string) => void;
}) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggleExpanded = useCallback((path: string, open: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open) next.add(path);
      else next.delete(path);
      return next;
    });
  }, []);

  const handleContextOpen = useCallback(
    (node: FileNode) => {
      if (node.type === 'file') {
        onOpen(node.path);
      } else {
        toggleExpanded(node.path, true);
        onSelectDir(node.path);
      }
    },
    [onOpen, onSelectDir, toggleExpanded],
  );

  const handleRootDragOver = (e: React.DragEvent) => {
    if (!dragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget('');
  };

  const handleRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
    setDragging(false);
    let payload: { path: string };
    try {
      payload = JSON.parse(e.dataTransfer.getData(DND_MIME));
    } catch {
      return;
    }
    if (!payload.path) return;
    const baseName = payload.path.split('/').pop() ?? payload.path;
    if (payload.path === baseName) return;
    onMove(payload.path, baseName);
  };

  const rootDropClass =
    dropTarget === '' ? 'bg-[var(--color-accent-soft)] ring-1 ring-inset ring-[var(--color-accent)]' : '';

  if (tree.length === 0) {
    return (
      <div
        className={`px-3 py-2 text-xs text-[var(--color-muted)] ${rootDropClass}`}
        onDragOver={handleRootDragOver}
        onDragLeave={() => setDropTarget(null)}
        onDrop={handleRootDrop}
        onDragEnter={() => setDragging(true)}
      >
        No files yet. Upload or create a file to get started.
      </div>
    );
  }

  return (
    <div
      className={`py-1 ${rootDropClass}`}
      onDragEnter={() => setDragging(true)}
      onDragEnd={() => {
        setDragging(false);
        setDropTarget(null);
      }}
      onDragOver={handleRootDragOver}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDropTarget(null);
      }}
      onDrop={handleRootDrop}
    >
      {tree.map((node) => (
        <NodeRow
          key={node.path}
          node={node}
          depth={0}
          activePath={activePath}
          selectedDir={selectedDir}
          dropTarget={dragging ? dropTarget : null}
          expanded={expanded}
          onOpen={onOpen}
          onDelete={onDelete}
          onSelectDir={onSelectDir}
          onMove={(from, to) => {
            setDropTarget(null);
            setDragging(false);
            onMove(from, to);
          }}
          onContextMenu={setContextMenu}
          onToggleExpanded={toggleExpanded}
          onDropTarget={setDropTarget}
        />
      ))}
      {contextMenu && (
        <FileContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onOpen={handleContextOpen}
          onCopyPath={onCopyPath}
          onDuplicate={onDuplicate}
          onAddFile={onAddFile}
          onAddFolder={onAddFolder}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
