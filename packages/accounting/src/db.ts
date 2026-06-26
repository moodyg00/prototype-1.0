import { PrismaClient } from '@prototype/db';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { accountingPrisma: PrismaClient | undefined };

function pickDatabaseUrl(): string {
  const value =
    process.env.DATABASE_URL ??
    process.env.SUPABASE_DB_URL ??
    process.env.SUPABASE_POOLER_URL;
  if (!value) {
    throw new Error('Missing DATABASE_URL for accounting operations.');
  }
  return value;
}

export function getAccountingPrisma(): PrismaClient {
  if (globalForPrisma.accountingPrisma) {
    return globalForPrisma.accountingPrisma;
  }

  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: pickDatabaseUrl() }) });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.accountingPrisma = client;
  }

  return client;
}
