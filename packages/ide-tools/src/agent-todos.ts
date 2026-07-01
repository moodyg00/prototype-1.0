export type AgentTodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type AgentTodoItem = {
  id: string;
  content: string;
  status: AgentTodoStatus;
};

/** Keep at most one in_progress item (Cursor-style focus). */
export function normalizeAgentTodos(todos: AgentTodoItem[]): AgentTodoItem[] {
  let seenInProgress = false;
  return todos.map((t) => {
    if (t.status !== 'in_progress') return t;
    if (seenInProgress) return { ...t, status: 'pending' as const };
    seenInProgress = true;
    return t;
  });
}

export function mergeAgentTodos(
  existing: AgentTodoItem[],
  incoming: AgentTodoItem[],
  merge: boolean,
): AgentTodoItem[] {
  if (!merge) return normalizeAgentTodos(incoming);
  const map = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) {
    map.set(t.id, t);
  }
  return normalizeAgentTodos(Array.from(map.values()));
}

export function activeAgentTodos(todos: AgentTodoItem[]): AgentTodoItem[] {
  return todos.filter((t) => t.status === 'pending' || t.status === 'in_progress');
}
