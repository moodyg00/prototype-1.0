import { prisma } from '@/src/lib/prisma';
import { generateUserApiKey } from '@/src/lib/auth/api-keys';
import { createInviteTokenForUser } from '@/src/lib/auth/invite-tokens';
import { hashPassword } from '@/src/lib/auth/password';
import { maskSecret } from '@/src/lib/integrations/credentials';
import { sendEmail } from '@/src/lib/email/provider';
import {
  automationUserCreateSchema,
  inviteAcceptSchema,
  userInviteSchema,
} from '@/src/lib/validation/users';

export class UserServiceError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, '');
  return 'http://localhost:3001';
}

export function buildInviteUrl(token: string): string {
  return `${getAppBaseUrl()}/invite/${token}`;
}

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string | null;
  username: string | null;
  userType: string;
  roleId: string | null;
  role: string;
  isActive: boolean;
  invitePending: boolean;
  maskedApiKey: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
};

function serializeUser(row: {
  id: string;
  fullName: string;
  email: string | null;
  username: string | null;
  userType: string;
  roleId: string | null;
  roleRef: { name: string } | null;
  passwordHash: string | null;
  apiKey: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date | null;
}): AdminUserRow {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    username: row.username,
    userType: row.userType,
    roleId: row.roleId,
    role: row.roleRef?.name ?? 'Unassigned',
    isActive: row.isActive,
    invitePending: row.userType === 'human' && !row.passwordHash,
    maskedApiKey: row.apiKey ? maskSecret(row.apiKey) : null,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  };
}

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  username: true,
  userType: true,
  roleId: true,
  roleRef: { select: { name: true } },
  passwordHash: true,
  apiKey: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: 'asc' }, { email: 'asc' }],
    select: userSelect,
  });
  return users.map(serializeUser);
}

export async function inviteHumanUser(
  input: unknown,
  options?: { createdBy?: string | null },
): Promise<{ user: AdminUserRow; inviteUrl: string; emailSent: boolean; emailDetail: string }> {
  const parsed = userInviteSchema.parse(input);
  const email = parsed.email.trim().toLowerCase();

  const [existing, role] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } }),
    prisma.userRole.findUnique({ where: { id: parsed.roleId }, select: { id: true, name: true } }),
  ]);

  if (!role) throw new UserServiceError('Role not found.', 404);
  if (existing?.passwordHash) {
    throw new UserServiceError('A user with this email already has an account.', 409);
  }

  const localPart = email.split('@')[0] ?? 'Invited user';
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          roleId: parsed.roleId,
          userType: 'human',
          isActive: true,
          updatedBy: options?.createdBy ?? null,
        },
        select: userSelect,
      })
    : await prisma.user.create({
        data: {
          email,
          fullName: localPart,
          roleId: parsed.roleId,
          userType: 'human',
          isActive: true,
          createdBy: options?.createdBy ?? null,
          updatedBy: options?.createdBy ?? null,
        },
        select: userSelect,
      });

  const token = await createInviteTokenForUser(user.id, { createdBy: options?.createdBy ?? null });
  const inviteUrl = buildInviteUrl(token);

  let emailSent = false;
  let emailDetail = 'Email not requested.';
  if (parsed.sendEmail) {
    const result = await sendEmail({
      to: email,
      subject: 'You are invited to Proto-2',
      text: `You have been invited to join as ${role.name}.\n\nAccept your invite and set your password:\n${inviteUrl}\n\nThis link expires in 7 days.`,
      html: `<p>You have been invited to join as <strong>${role.name}</strong>.</p><p><a href="${inviteUrl}">Accept your invite and set your password</a></p><p>This link expires in 7 days.</p>`,
    });
    emailSent = result.delivered;
    emailDetail = result.detail;
  }

  return {
    user: serializeUser(user),
    inviteUrl,
    emailSent,
    emailDetail,
  };
}

export async function createAutomationUser(
  input: unknown,
  options?: { createdBy?: string | null },
): Promise<{ user: AdminUserRow; apiKey: string }> {
  const parsed = automationUserCreateSchema.parse(input);

  if (parsed.roleId) {
    const role = await prisma.userRole.findUnique({ where: { id: parsed.roleId }, select: { id: true } });
    if (!role) throw new UserServiceError('Role not found.', 404);
  }

  let apiKey = generateUserApiKey();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const user = await prisma.user.create({
        data: {
          fullName: parsed.fullName,
          userType: parsed.userType,
          roleId: parsed.roleId ?? null,
          description: parsed.description?.trim() || null,
          aiModel: parsed.aiModel?.trim() || null,
          apiKey,
          isActive: true,
          createdBy: options?.createdBy ?? null,
          updatedBy: options?.createdBy ?? null,
        },
        select: userSelect,
      });
      return { user: serializeUser(user), apiKey };
    } catch (error) {
      const isUniqueViolation =
        error instanceof Error && /Unique constraint|unique/i.test(error.message);
      if (!isUniqueViolation || attempt === 4) throw error;
      apiKey = generateUserApiKey();
    }
  }

  throw new UserServiceError('Unable to generate a unique API key.', 500);
}

export async function acceptInvite(
  token: string,
  input: unknown,
): Promise<{ userId: string; email: string; username: string }> {
  const parsed = inviteAcceptSchema.parse(input);
  const { findValidInvite, consumeInviteToken } = await import('@/src/lib/auth/invite-tokens');
  const invite = await findValidInvite(token);
  if (!invite) throw new UserServiceError('Invite link is invalid or expired.', 404);

  const usernameTaken = await prisma.user.findUnique({
    where: { username: parsed.username },
    select: { id: true },
  });
  if (usernameTaken && usernameTaken.id !== invite.userId) {
    throw new UserServiceError('Username is already taken.', 409);
  }

  const passwordHash = hashPassword(parsed.password);
  const fullName = parsed.fullName?.trim() || undefined;

  await prisma.user.update({
    where: { id: invite.userId },
    data: {
      username: parsed.username,
      passwordHash,
      ...(fullName ? { fullName } : {}),
      isActive: true,
    },
  });

  const consumed = await consumeInviteToken(token, invite.userId);
  if (!consumed) throw new UserServiceError('Invite link is invalid or expired.', 404);

  return {
    userId: invite.userId,
    email: invite.email,
    username: parsed.username,
  };
}
