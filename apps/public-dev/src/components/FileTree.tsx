'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  Folder,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import type { FileNode } from '@/src/lib/types';

function NodeRow({
  node,
  depth,
  activePath,
  onOpen,
  onDelete,
}: {
  node: FileNode;
  depth: number;
  activePath: string | null;
  onOpen: (path: string) => void;
  onDelete: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const pad = { paddingLeft: `${depth * 12 + 8}px` };

  if (node.type === 'dir') {
    return (
      <div>
        <div
          className="group flex items-center gap-1 py-1 pr-2 text-sm text-[var(--color-fg)] hover:bg-[var(--color-panel-2)] cursor-pointer select-none"
          style={pad}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {open ? <FolderOpen size={14} className="text-[var(--color-accent)]" /> : <Folder size={14} className="text-[var(--color-accent)]" />}
          <span className="truncate">{node.name}</span>
          <button
            className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-[var(--color-danger)]"
            title="Delete folder"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.path);
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
        {open && node.children?.map((child) => (
          <NodeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            activePath={activePath}
            onOpen={onOpen}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  const isActive = activePath === node.path;
  return (
    <div
      className={`group flex items-center gap-1 py-1 pr-2 text-sm cursor-pointer select-none ${
        isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-fg)]' : 'text-[var(--color-muted)] hover:bg-[var(--color-panel-2)] hover:text-[var(--color-fg)]'
      }`}
      style={{ paddingLeft: `${depth * 12 + 26}px` }}
      onClick={() => onOpen(node.path)}
    >
      <FileIcon size={14} />
      <span className="truncate">{node.name}</span>
      <button
        className="ml-auto opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-[var(--color-danger)]"
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
  onOpen,
  onDelete,
}: {
  tree: FileNode[];
  activePath: string | null;
  onOpen: (path: string) => void;
  onDelete: (path: string) => void;
}) {
  if (tree.length === 0) {
    return <div className="px-3 py-2 text-xs text-[var(--color-muted)]">No files yet.</div>;
  }
  return (
    <div className="py-1">
      {tree.map((node) => (
        <NodeRow
          key={node.path}
          node={node}
          depth={0}
          activePath={activePath}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
