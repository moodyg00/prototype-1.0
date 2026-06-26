import { AsyncLocalStorage } from 'node:async_hooks';

import { getAuthConfig } from '@prototype/auth';

import { getSessionUserIdFromCookies } from '@/src/lib/auth/get-session';
import { prismaBase } from '@/src/lib/prisma-base';

export type ChangeLogAction = 'create' | 'update' | 'delete' | 'automation';

/** Standard audit payload stored in change_log.changes */
export type AuditChanges =
  | { new: Record<string, unknown> }
  | { original: Record<string, unknown> }
  | { original: Record<string, unknown>; new: Record<string, unknown> }
  | Record<string, unknown>;

export type LogChangeArgs = {
  tableName: string;
  recordId: string;
  action: ChangeLogAction;
  userId?: string | null;
  changes?: AuditChanges;
  metadata?: Record<string, unknown>;
};

const DEFAULT_SECRET_KEYS = ['password', 'apiKey', 'apiSecret', 'webhookSecret'] as const;

/** Strip secret values before persisting to change_log. */
export function redactForChangeLog(
  values: Record<string, unknown>,
  secretKeys: readonly string[] = DEFAULT_SECRET_KEYS,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const key of secretKeys) {
    if (key in out && out[key] !== undefined && out[key] !== null && String(out[key]).length > 0) {
      out[key] = '[redacted]';
    }
  }
  return out;
}

/** Skip flag used by the Prisma audit extension while writing audit rows. */
export const auditSkipStorage = new AsyncLocalStorage<boolean>();

let cachedActingUser: { id: string | null; at: number } | null = null;
const ACTING_USER_CACHE_MS = 30_000;

/**
 * Resolves the user id to attribute an admin action to.
 *
 * Uses the session cookie when present. When auth is disabled in development
 * or no session exists, falls back to the first active admin user so demo
 * actions still carry attribution.
 */
export async function resolveActingUserId(): Promise<string | null> {
  if (cachedActingUser && Date.now() - cachedActingUser.at < ACTING_USER_CACHE_MS) {
    return cachedActingUser.id;
  }

  let userId: string | null = null;

  try {
    userId = await getSessionUserIdFromCookies();
  } catch {
    // Session lookup optional in dev.
  }

  if (!userId && !getAuthConfig().required) {
    const fallback = await prismaBase.user.findFirst({
      where: { isActive: true, roleRef: { name: 'Admin' } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    userId = fallback?.id ?? null;
  }

  cachedActingUser = { id: userId, at: Date.now() };
  return userId;
}

/**
 * Writes an entry to the `change_log` table. Never throws: logging must not
 * break the action being logged.
 */
export async function writeAuditEntry(args: LogChangeArgs): Promise<void> {
  try {
    const userId = args.userId !== undefined ? args.userId : await resolveActingUserId();

    await auditSkipStorage.run(true, async () => {
      await prismaBase.changeLog.create({
        data: {
          tableName: args.tableName,
          recordId: args.recordId,
          action: args.action,
          userId,
          changes: args.changes as never,
          metadata: args.metadata as never,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });
  } catch (error) {
    console.error('[change-log] Failed to record action:', error);
  }
}

/** @deprecated Prefer automatic Prisma audit logging; kept for semantic automation events. */
export async function logChange(args: LogChangeArgs): Promise<void> {
  await writeAuditEntry(args);
}
