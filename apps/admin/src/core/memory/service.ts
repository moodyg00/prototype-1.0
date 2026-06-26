import fs from 'fs/promises';
import path from 'path';
import { MemoryEvent, Persona, MemorySettings } from './types';

const DATA_DIR = path.join(process.cwd(), '.data', 'memory');

async function ensureDir(dir: string) {
  try { await fs.mkdir(dir, { recursive: true }); } catch {}
}

export class MemoryService {
  private events: MemoryEvent[] = [];
  private personas: Map<string, Persona> = new Map();
  private settings: Map<string, MemorySettings> = new Map();

  async initialize() {
    await ensureDir(DATA_DIR);
    try {
      const eventsFile = path.join(DATA_DIR, 'events.jsonl');
      const data = await fs.readFile(eventsFile, 'utf8').catch(() => '');
      this.events = data
        .split('\n')
        .filter(Boolean)
        .map(l => JSON.parse(l));
    } catch {}
  }

  async logEvent(event: Omit<MemoryEvent, 'id' | 'timestamp'>): Promise<MemoryEvent> {
    const full: MemoryEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    this.events.push(full);

    await ensureDir(DATA_DIR);
    const eventsFile = path.join(DATA_DIR, 'events.jsonl');
    await fs.appendFile(eventsFile, JSON.stringify(full) + '\n');

    return full;
  }

  async logStrategicEvent(agentId: string, content: string, level: 1 | 2 | 3 = 2, metadata?: any) {
    return this.logEvent({
      agentId,
      type: level === 3 ? 'persona' : 'scene',
      level,
      content,
      metadata,
    });
  }

  async searchMemories(agentId: string, query: string, limit = 20): Promise<MemoryEvent[]> {
    const q = query.toLowerCase();
    return this.events
      .filter(e => e.agentId === agentId)
      .filter(e =>
        e.content.toLowerCase().includes(q) ||
        JSON.stringify(e.metadata || {}).toLowerCase().includes(q)
      )
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async getRecent(agentId: string, limit = 30): Promise<MemoryEvent[]> {
    return this.events
      .filter(e => e.agentId === agentId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  async getPersona(agentId: string): Promise<Persona> {
    if (this.personas.has(agentId)) return this.personas.get(agentId)!;

    const defaultPersona: Persona = {
      agentId,
      name: `Agent ${agentId}`,
      role: 'Department Head',
      goals: ['Maximize business outcomes', 'Maintain high-quality memory', 'Respect automation boundaries'],
      constraints: ['Never perform irreversible actions without human approval', 'Always log strategic decisions'],
      tone: 'professional, concise, decisive',
      tuning: { temperature: 0.4, focusOn: 'strategic' },
    };
    this.personas.set(agentId, defaultPersona);
    return defaultPersona;
  }

  async updatePersona(agentId: string, updates: Partial<Persona>) {
    const p = await this.getPersona(agentId);
    const updated = { ...p, ...updates };
    this.personas.set(agentId, updated);
    await this.logStrategicEvent(agentId, `Persona updated: ${Object.keys(updates).join(', ')}`, 3);
    return updated;
  }

  async getSettings(agentId: string): Promise<MemorySettings> {
    if (this.settings.has(agentId)) return this.settings.get(agentId)!;
    const s: MemorySettings = {
      agentId,
      recallStrategy: 'hierarchical',
      maxRecall: 40,
      compressionLevel: 2,
      autoTuningEnabled: true,
    };
    this.settings.set(agentId, s);
    return s;
  }

  async updateSettings(agentId: string, updates: Partial<MemorySettings>) {
    const s = await this.getSettings(agentId);
    const updated = { ...s, ...updates };
    this.settings.set(agentId, updated);
    await this.logStrategicEvent(agentId, `Settings updated: ${Object.keys(updates).join(', ')}`, 2);
    return updated;
  }
}

export const memoryService = new MemoryService();
