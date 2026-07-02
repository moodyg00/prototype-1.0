/** Retired c-suite demo agents — excluded from UI and registry seeding. */
export const LEGACY_CSUITE_AGENT_IDS = ['ceo', 'cfo', 'cto', 'coo', 'clo'] as const;

const LEGACY_SET = new Set<string>(LEGACY_CSUITE_AGENT_IDS);

export function isLegacyCsuiteAgentId(id: string): boolean {
  return LEGACY_SET.has(id.trim().toLowerCase());
}

export function withoutLegacyCsuiteAgentIds(ids: string[]): string[] {
  const out = ids.filter((id) => !isLegacyCsuiteAgentId(id));
  if (!out.includes('default')) out.unshift('default');
  return [...new Set(out)];
}