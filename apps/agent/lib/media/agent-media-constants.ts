/** Same sentinel as admin global uploads — agent library links use role `agent:{id}`. */
export const GLOBAL_AGENT_UPLOAD_OWNER_ID = '00000000-0000-4000-8000-000000000000';

export const AGENT_MEDIA_LIBRARY_TYPES = ['content', 'submitted', 'admin_record'] as const;

export type AgentMediaTag = {
  workspace?: 'agent';
  agentId?: string;
  origin?: 'upload' | 'generation' | 'edit';
  generationId?: string;
  labels?: string[];
};