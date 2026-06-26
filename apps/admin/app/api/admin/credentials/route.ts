import { NextResponse } from 'next/server';

import { handleRouteError, readJsonBody } from '@/src/lib/accounting/api-helpers';
import { maskSecret } from '@/src/lib/integrations/credentials';
import { prisma } from '@/src/lib/prisma';
import { credentialCreateSchema } from '@/src/lib/validation/credentials';

const CREDENTIAL_LIST_SELECT = {
  id: true,
  name: true,
  siteUrl: true,
  username: true,
  password: true,
  notes: true,
  isActive: true,
  lastUsedAt: true,
} as const;

const CREDENTIAL_DETAIL_SELECT = {
  ...CREDENTIAL_LIST_SELECT,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    const credentials = await prisma.credential.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: CREDENTIAL_LIST_SELECT,
    });
    return NextResponse.json({
      credentials: credentials.map((row) => ({
        id: row.id,
        name: row.name,
        siteUrl: row.siteUrl,
        username: row.username,
        maskedPassword: maskSecret(row.password),
        notes: row.notes,
        isActive: row.isActive,
        lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<unknown>(request);
    const parsed = credentialCreateSchema.parse(body);
    const credential = await prisma.credential.create({
      data: {
        name: parsed.name,
        siteUrl: parsed.siteUrl?.trim() || null,
        username: parsed.username,
        password: parsed.password,
        notes: parsed.notes?.trim() || null,
        isActive: parsed.isActive ?? true,
      },
      select: CREDENTIAL_DETAIL_SELECT,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
