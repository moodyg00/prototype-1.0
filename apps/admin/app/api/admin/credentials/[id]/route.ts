import { NextResponse } from 'next/server';

import { handleRouteError, jsonError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { prisma } from '@/src/lib/prisma';
import { credentialUpdateSchema } from '@/src/lib/validation/credentials';

type RouteParams = { params: Promise<{ id: string }> };

const CREDENTIAL_DETAIL_SELECT = {
  id: true,
  name: true,
  siteUrl: true,
  username: true,
  password: true,
  notes: true,
  isActive: true,
  lastUsedAt: true,
} as const;

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const credential = await prisma.credential.findUnique({
      where: { id },
      select: CREDENTIAL_DETAIL_SELECT,
    });
    if (!credential) return jsonError(404, 'Credential not found.');
    return NextResponse.json({
      credential: {
        id: credential.id,
        name: credential.name,
        siteUrl: credential.siteUrl,
        username: credential.username,
        password: credential.password,
        notes: credential.notes,
        isActive: credential.isActive,
        lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await readJsonBody<unknown>(request);
    const parsed = credentialUpdateSchema.parse(body);
    const credential = await prisma.credential.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.siteUrl !== undefined ? { siteUrl: parsed.siteUrl?.trim() || null } : {}),
        ...(parsed.username !== undefined ? { username: parsed.username } : {}),
        ...(parsed.password?.trim() ? { password: parsed.password } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes?.trim() || null } : {}),
        ...(parsed.isActive !== undefined ? { isActive: parsed.isActive } : {}),
      },
      select: CREDENTIAL_DETAIL_SELECT,
    });

    return NextResponse.json({
      credential: {
        id: credential.id,
        name: credential.name,
        siteUrl: credential.siteUrl,
        username: credential.username,
        password: credential.password,
        notes: credential.notes,
        isActive: credential.isActive,
        lastUsedAt: credential.lastUsedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await prisma.credential.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!existing) return jsonError(404, 'Credential not found.');

    await prisma.credential.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
