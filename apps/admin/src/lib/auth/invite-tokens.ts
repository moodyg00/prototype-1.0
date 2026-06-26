import { createHash, randomBytes } from 'node:crypto';

import { prisma } from '@/src/lib/prisma';

const INVITE_PREFIX = 'inv_';
const DEFAULT_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateInviteToken(): string {
  return `${INVITE_PREFIX}${randomBytes(32).toString('base64url')}`;
}

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createInviteTokenForUser(
  userId: string,
  options?: { ttlMs?: number; createdBy?: string | null },
): Promise<string> {
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + (options?.ttlMs ?? DEFAULT_INVITE_TTL_MS));

  await prisma.passwordReset.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      createdBy: options?.createdBy ?? null,
    },
  });

  return token;
}

export type ValidInvite = {
  userId: string;
  email: string;
  roleName: string | null;
  expiresAt: Date;
};

export async function findValidInvite(token: string): Promise<ValidInvite | null> {
  const tokenHash = hashInviteToken(token);
  const row = await prisma.passwordReset.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          passwordHash: true,
          userType: true,
          roleRef: { select: { name: true } },
        },
      },
    },
  });

  if (!row?.user?.email) return null;
  if (row.user.userType !== 'human') return null;
  if (row.user.passwordHash) return null;

  return {
    userId: row.user.id,
    email: row.user.email,
    roleName: row.user.roleRef?.name ?? null,
    expiresAt: row.expiresAt,
  };
}

export async function consumeInviteToken(token: string, userId: string): Promise<boolean> {
  const tokenHash = hashInviteToken(token);
  const result = await prisma.passwordReset.updateMany({
    where: {
      userId,
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });
  return result.count > 0;
}
