/**
 * Shared Operator + View primitives for deep integration (no iframes).
 * These power the reusable LiveBrowserView + EventStream for the visual browser and other workspaces.
 */

export type EventType = 'thought' | 'action' | 'observation' | 'error' | 'screenshot' | 'plan' | 'result';

export interface AgentEvent {
  id: string;
  ts: number; // epoch ms
  type: EventType;
  content: string;
  // Optional structured data
  screenshot?: string; // data: URL or public path for current view image
  coords?: [number, number]; // for click/tap actions
  tool?: string; // e.g. 'browser', 'mouse', 'keyboard', 'vision'
  confidence?: number;
}

export interface ViewState {
  // What the "live view" should render right now
  kind: 'desktop' | 'browser' | 'vscode' | 'mobile' | 'custom';
  title?: string; // e.g. "Craigslist - search results"
  url?: string;
  content?: string; // textual representation or description for mock rendering
  screenshot?: string; // latest full screenshot data url if available
  highlight?: { x: number; y: number; w?: number; h?: number }; // action highlight rect (relative 0-1 or px)
  status: 'idle' | 'thinking' | 'acting' | 'observing' | 'error' | 'waiting';
}

export interface Operator {
  readonly id: string;
  readonly label: string;

  // Core control
  runTask(prompt: string): Promise<void>;
  stop(): void;

  // Subscribe to live events (returns unsubscribe fn)
  subscribe(listener: (event: AgentEvent) => void): () => void;

  // Current snapshot for views
  getCurrentView(): ViewState;
  getEvents(): AgentEvent[];

  // Optional: domain actions exposed by this operator (e.g. "takeScreenshot", "click", "type")
  // For future extensibility without per-app special casing
  invoke?(action: string, payload?: any): Promise<any>;

  // For "real" operators: connection state
  isReal?: boolean;
  connectInfo?: { url?: string; model?: string };
}

// Helper to make unique ids for events
export function makeEventId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// Common event factory
export function makeEvent(type: EventType, content: string, extra: Partial<AgentEvent> = {}): AgentEvent {
  return {
    id: makeEventId(),
    ts: Date.now(),
    type,
    content,
    ...extra,
  };
}
