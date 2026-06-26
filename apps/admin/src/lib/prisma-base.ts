/**
 * Unextended Prisma client — used for audit writes and as the base for extensions.
 */
import { PrismaClient } from '@prototype/db';
import { PrismaPg } from '@prisma/adapter-pg';
import { getDatabaseUrl } from '@/src/lib/env';

const globalForPrisma = globalThis as unknown as { prismaBase: PrismaClient | undefined };

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  return new PrismaClient({ adapter });
}

export const prismaBase: PrismaClient = globalForPrisma.prismaBase ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaBase = prismaBase;
}
