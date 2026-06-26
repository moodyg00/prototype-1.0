"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WorkspacePanel } from './WorkspacePanel';
import { BrowserPanel } from './panels/BrowserPanel';
import { PureBrowserPanel } from './panels/PureBrowserPanel';
import { TeamPanel } from './panels/TeamPanel';
import { WorkflowPanel } from './panels/WorkflowPanel';
import { LangSmithPanel } from './panels/LangSmithPanel';
import { PlaceholderPanel } from './panels/PlaceholderPanel';
import { PanelInstance, defaultPanelId } from '../lib/panels';
import { getWorkspace, WorkspaceId } from '../lib/workspaces';

const STORAGE_KEY = 'aa-canvas-panels';
const BASE_Z = 10;

function cascadeOffset(count: number) {
  const step = 28;
  return { x: 80 + (count % 8) * step, y: 80 + (count % 8) * step };
}

function loadPanels(): PanelInstance[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PanelInstance[]) : [];
  } catch { return []; }
}

function savePanels(panels: PanelInstance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
}

interface WorkspaceCanvasProps {
  toggleTarget: WorkspaceId | null;
  onToggleConsumed: () => void;
}

export function WorkspaceCanvas({ toggleTarget, onToggleConsumed }: WorkspaceCanvasProps) {
  const [panels, setPanels] = useState<PanelInstance[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const maxZ = useRef(BASE_Z);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const saved = loadPanels();
    if (saved.length > 0) {
      maxZ.current = BASE_Z + saved.length;
      setPanels(saved);
    }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (hydrated) savePanels(panels); }, [panels, hydrated]);


  // Default: open visual-browser if canvas is empty (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    if (panels.length === 0) {
      const ws = getWorkspace('visual-browser');
      const id = defaultPanelId('visual-browser');
      maxZ.current = BASE_Z + 1;
      setPanels([{
        id,
        workspaceId: 'visual-browser',
        x: 40, y: 20,
        w: ws.defaultSize.w,
        h: ws.defaultSize.h,
        minimized: false,
        zIndex: maxZ.current,
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Handle header toggle requests
  useEffect(() => {
    if (!toggleTarget) return;
    onToggleConsumed();
    const existingId = defaultPanelId(toggleTarget);
    const existing = panels.find(p => p.id === existingId);
    if (existing) {
      maxZ.current += 1;
      setPanels(prev =>
        prev.map(p =>
          p.id === existingId
            ? { ...p, minimized: false, zIndex: maxZ.current }
            : p
        )
      );
    } else {
      const ws = getWorkspace(toggleTarget);
      const offset = cascadeOffset(panels.length);
      maxZ.current += 1;
      const next: PanelInstance = {
        id: existingId,
        workspaceId: toggleTarget,
        x: offset.x, y: offset.y,
        w: ws.defaultSize.w, h: ws.defaultSize.h,
        minimized: false,
        zIndex: maxZ.current,
      };
      setPanels(prev => [...prev, next]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleTarget]);

  const focusPanel = useCallback((id: string) => {
    maxZ.current += 1;
    setPanels(prev => prev.map(p => p.id === id ? { ...p, zIndex: maxZ.current } : p));
  }, []);

  const closePanel = useCallback((id: string) => {
    setPanels(prev => prev.filter(p => p.id !== id));
  }, []);

  const minimizePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, minimized: !p.minimized } : p));
  }, []);

  const movePanel = useCallback((id: string, x: number, y: number) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, x, y } : p));
  }, []);

  const resizePanel = useCallback((id: string, w: number, h: number) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, w, h } : p));
  }, []);

  return (
    <div className="workspace-canvas">
      {panels.map(panel => (
        <WorkspacePanel
          key={panel.id}
          panel={panel}
          onFocus={focusPanel}
          onClose={closePanel}
          onMinimize={minimizePanel}
          onMove={movePanel}
          onResize={resizePanel}
        >
          <PanelContent workspaceId={panel.workspaceId} />
        </WorkspacePanel>
      ))}
    </div>
  );
}

function PanelContent({ workspaceId }: { workspaceId: WorkspaceId }) {
  if (workspaceId === 'team') return <TeamPanel />;
  if (workspaceId === 'workflow') return <WorkflowPanel />;
  if (workspaceId === 'langsmith') return <LangSmithPanel />;
  if (workspaceId === 'pure-browser') return <PureBrowserPanel />;
  if (workspaceId === 'visual-browser') return <BrowserPanel />;
  const workspace = getWorkspace(workspaceId);
  return <PlaceholderPanel workspace={workspace} />;
}
