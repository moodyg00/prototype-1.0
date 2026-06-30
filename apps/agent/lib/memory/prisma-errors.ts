/** True when Postgres catalog tables are not migrated yet. */
export function isMissingMemoryCatalogError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /memory_chunks/i.test(message) ||
    /memory_agent_bindings/i.test(message) ||
    /relation .* does not exist/i.test(message) ||
    /P2021/i.test(message)
  );
}

export function memoryCatalogHint(): string {
  return 'Memory catalog tables missing. Run: pnpm --filter @prototype/db exec prisma migrate deploy';
}