/**
 * Prisma client singleton with automatic audit logging on create/update/delete.
 */
import type { PrismaClient } from '@prototype/db';

import { withAuditExtension } from '@/src/lib/prisma-audit';
import { prismaBase } from '@/src/lib/prisma-base';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createAuditedClient(): PrismaClient {
  return withAuditExtension(prismaBase);
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createAuditedClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prismaBase };
