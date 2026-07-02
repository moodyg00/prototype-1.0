'use client';

import { useEffect } from 'react';

import { useWorkflowRegistry } from '@/components/panels/workflow/WorkflowProvider';
import { useWorkspace } from '@/components/workspace/WorkspaceProvider';
import {
  WORKFLOW_DISPOSE_SCOPE_EVENT,
  WORKFLOW_SCOPE_PERSIST_EVENT,
  dispatchWorkflowDisposeScope,
} from '@/lib/agent-navigation';
import { setPersistedScopeWorkflowIds } from '@/lib/workflow-scope-persist';

/** Bridges workspace studio lifecycle and workflow scope persistence. */
export function WorkflowScopeBridge() {
  const { session, persistScopeWorkflowId, clearScopeWorkflowId } = useWorkspace();
  const registry = useWorkflowRegistry();

  useEffect(() => {
    setPersistedScopeWorkflowIds(session.scopeWorkflowIds ?? {});
  }, [session.scopeWorkflowIds]);

  useEffect(() => {
    const onDispose = (ev: Event) => {
      const scopeId = (ev as CustomEvent<{ scopeId: string }>).detail.scopeId;
      registry.disposeScope(scopeId);
      clearScopeWorkflowId(scopeId);
    };
    const onPersist = (ev: Event) => {
      const { scopeId, workflowId } = (ev as CustomEvent<{ scopeId: string; workflowId: string }>).detail;
      persistScopeWorkflowId(scopeId, workflowId);
    };
    window.addEventListener(WORKFLOW_DISPOSE_SCOPE_EVENT, onDispose);
    window.addEventListener(WORKFLOW_SCOPE_PERSIST_EVENT, onPersist);
    return () => {
      window.removeEventListener(WORKFLOW_DISPOSE_SCOPE_EVENT, onDispose);
      window.removeEventListener(WORKFLOW_SCOPE_PERSIST_EVENT, onPersist);
    };
  }, [registry, persistScopeWorkflowId, clearScopeWorkflowId]);

  return null;
}

export { dispatchWorkflowDisposeScope };
