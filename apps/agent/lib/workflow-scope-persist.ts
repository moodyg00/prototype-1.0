let persistedScopeWorkflowIds: Record<string, string> = {};

export function setPersistedScopeWorkflowIds(ids: Record<string, string>): void {
  persistedScopeWorkflowIds = ids;
}

export function getPersistedWorkflowId(scopeId: string): string | undefined {
  return persistedScopeWorkflowIds[scopeId];
}
