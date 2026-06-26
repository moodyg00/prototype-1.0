export interface MemoryEvent {
  id: string;
  agentId: string;
  type: 'raw' | 'fact' | 'scene' | 'persona';
  level: 0 | 1 | 2 | 3;
  content: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface Persona {
  agentId: string;
  name: string;
  role: string;
  goals: string[];
  constraints: string[];
  tone: string;
  tuning: Record<string, any>;
}

export interface MemorySettings {
  agentId: string;
  recallStrategy: 'recent' | 'relevant' | 'hierarchical';
  maxRecall: number;
  compressionLevel: number;
  autoTuningEnabled: boolean;
}
