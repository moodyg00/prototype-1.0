'use client';

import { useEffect, useRef } from 'react';
import {
  ClipboardCopy,
  Copy,
  FilePlus2,
  FileText,
  FolderOpen,
  FolderPlus,
  Trash2,
} from 'lucide-react';
import type { FileNode } from '@/src/lib/types';

export type ContextMenuState = {
  x: number;
  y: number;
  node: FileNode;
};

type MenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export function FileContextMenu({
  menu,
  onClose,
  onOpen,
  onCopyPath,
  onDuplicate,
  onAddFile,
  onAddFolder,
  onDelete,
}: {
  menu: ContextMenuState;
  onClose: () => void;
  onOpen: (node: FileNode) => void;
  onCopyPath: (path: string) => void;
  onDuplicate: (path: string) => void;
  onAddFile: (dirPath: string) => void;
  onAddFolder: (dirPath: string) => void;
  onDelete: (path: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { node } = menu;
  const isDir = node.type === 'dir';
  const parentDir = isDir ? node.path : node.path.split('/').slice(0, -1).join('/');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer);
    };
  }, [onClose]);

  const items: MenuItem[] = [
    {
      label: isDir ? 'Expand' : 'Open',
      icon: isDir ? <FolderOpen size={14} /> : <FileText size={14} />,
      onClick: () => {
        onOpen(node);
        onClose();
      },
    },
    {
      label: 'Copy path',
      icon: <ClipboardCopy size={14} />,
      onClick: () => {
        onCopyPath(node.path);
        onClose();
      },
    },
    ...(isDir
      ? []
      : [
          {
            label: 'Duplicate',
            icon: <Copy size={14} />,
            onClick: () => {
              onDuplicate(node.path);
              onClose();
            },
          } satisfies MenuItem,
        ]),
    {
      label: 'Add file',
      icon: <FilePlus2 size={14} />,
      onClick: () => {
        onAddFile(parentDir);
        onClose();
      },
    },
    {
      label: 'Add folder',
      icon: <FolderPlus size={14} />,
      onClick: () => {
        onAddFolder(parentDir);
        onClose();
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 size={14} />,
      danger: true,
      onClick: () => {
        onDelete(node.path);
        onClose();
      },
    },
  ];

  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  const left = Math.min(menu.x, vw - 200);
  const top = Math.min(menu.y, vh - items.length * 36 - 16);

  return (
    <div
      ref={ref}
      className="fixed z-50 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] py-1 shadow-2xl"
      style={{ left, top }}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          disabled={item.disabled}
          onClick={item.onClick}
          className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-[var(--color-panel-2)] disabled:opacity-40 ${
            item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-fg)]'
          }`}
        >
          <span className="text-[var(--color-muted)]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
