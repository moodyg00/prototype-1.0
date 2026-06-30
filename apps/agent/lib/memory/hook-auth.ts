export function assertMemoryHookSecret(req: Request): void {
  const expected = process.env.MEMORY_WEBHOOK_SECRET ?? process.env.MEMORY_CRON_SECRET;
  if (!expected) return;

  const header =
    req.headers.get('x-memory-webhook-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  if (header !== expected) {
    throw new Error('Unauthorized');
  }
}

export function assertMemoryCronSecret(req: Request): void {
  const expected = process.env.MEMORY_CRON_SECRET ?? process.env.MEMORY_WEBHOOK_SECRET;
  if (!expected) {
    throw new Error('MEMORY_CRON_SECRET is not configured');
  }
  const header =
    req.headers.get('x-memory-cron-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    '';
  if (header !== expected) throw new Error('Unauthorized');
}