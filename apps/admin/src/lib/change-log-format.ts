export type AuditChangesView = Record<string, unknown> | null;

export function changesFieldCount(changes: AuditChangesView): number {
  if (!changes) return 0;
  const original = changes.original;
  const next = changes.new;
  if (original && next && typeof original === 'object' && typeof next === 'object') {
    return Object.keys(original as Record<string, unknown>).length;
  }
  if (next && typeof next === 'object') {
    return Object.keys(next as Record<string, unknown>).length;
  }
  if (original && typeof original === 'object') {
    return Object.keys(original as Record<string, unknown>).length;
  }
  return Object.keys(changes).length;
}

export function changesSummary(changes: AuditChangesView, action: string): string {
  if (!changes) return 'No field snapshot';
  const count = changesFieldCount(changes);
  if (action === 'create' && changes.new) return `${count} field${count === 1 ? '' : 's'} recorded`;
  if (action === 'delete' && changes.original) return `${count} field${count === 1 ? '' : 's'} archived`;
  if (changes.original && changes.new) {
    return `${count} field${count === 1 ? '' : 's'} changed`;
  }
  if (count > 0) return `${count} field${count === 1 ? '' : 's'} logged`;
  return 'Details available';
}

export function formatAuditChangesJson(changes: AuditChangesView): string {
  if (!changes) return '{}';
  return JSON.stringify(changes, null, 2);
}
