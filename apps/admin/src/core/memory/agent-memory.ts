import { memoryService } from './service';
import { MemoryEvent, Persona, MemorySettings } from './types';

/**
 * AgentMemory wrapper around the core MemoryService.
 * Matches the exact interface requested for Tencent TdaiCore-style delegation.
 * Currently delegates to the high-fidelity in-memory + file-persisted service.
 * Easy to swap the underlying implementation for real Tencent later.
 */
export class AgentMemory {
  private agentId: string;

  constructor(options: { agentId: string; baseDataDir?: string }) {
    this.agentId = options.agentId;
  }

  async initialize(): Promise<void> {
    await memoryService.initialize();
  }

  // === Core delegation methods (exactly as specified in requirements) ===
  async searchMemories(query: string, limit?: number): Promise<MemoryEvent[]> {
    return memoryService.searchMemories(this.agentId, query, limit);
  }

  async handleBeforeRecall(context: any): Promise<any> {
    // Hook for future pre-recall filtering / persona injection
    const persona = await this.getPersona();
    return { ...context, persona };
  }

  async handleTurnCommitted(turn: { input: string; output: string; toolsUsed?: string[] }): Promise<void> {
    await memoryService.logStrategicEvent(
      this.agentId,
      `Turn committed: ${turn.input.slice(0, 120)} → ${turn.output.slice(0, 120)}`,
      2,
      { tools: turn.toolsUsed }
    );
  }

  async getRecentMemories(limit = 20): Promise<MemoryEvent[]> {
    return memoryService.getRecent(this.agentId, limit);
  }

  // === Persona & Settings (tuning / hierarchy support) ===
  async getPersona(): Promise<Persona> {
    return memoryService.getPersona(this.agentId);
  }

  async updatePersona(updates: Partial<Persona>): Promise<Persona> {
    return memoryService.updatePersona(this.agentId, updates);
  }

  async getSettings(): Promise<MemorySettings> {
    return memoryService.getSettings(this.agentId);
  }

  async updateSettings(updates: Partial<MemorySettings>): Promise<MemorySettings> {
    return memoryService.updateSettings(this.agentId, updates);
  }

  async requestSettingsChange(proposed: Partial<MemorySettings>, reason: string) {
    // In a real hierarchy this would notify a parent agent / human.
    // For now we just apply + log.
    const updated = await this.updateSettings(proposed);
    await memoryService.logStrategicEvent(
      this.agentId,
      `Settings change requested: ${reason}`,
      2,
      { proposed }
    );
    return updated;
  }
}

// Factory for per-agent instances (used by runtime)
export function createAgentMemory(agentId: string): AgentMemory {
  return new AgentMemory({ agentId });
}
