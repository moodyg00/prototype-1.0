import { PrismaClient } from '@prototype/db';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { authPrisma: PrismaClient | undefined };

function pickDatabaseUrl(): string {
  const value =
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.SUPABASE_POOLER_URL;
  if (!value) {
    throw new Error('Missing DATABASE_URL for auth session lookup.');
  }
  return value;
}

export function getAuthPrisma(): PrismaClient {
  if (globalForPrisma.authPrisma) {
    return globalForPrisma.authPrisma;
  }

  const adapter = new PrismaPg({ connectionString: pickDatabaseUrl() });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.authPrisma = client;
  }

  return client;
}
