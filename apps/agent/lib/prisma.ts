import { PrismaClient } from '@prototype/db';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function hasRequiredDelegates(client: PrismaClient | undefined) {
  if (!client) return false;
  const c = client as object;
  return 'workflow' in c && 'memoryChunk' in c && 'memoryAgentBinding' in c;
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[Prisma] No DATABASE_URL, Prisma client will not be initialized (secure store will fallback to file).');
    return null as any;
  }
  // Extract the ?schema=... parameter — the pg Pool doesn't understand it,
  // but PrismaPg needs it to query the right PostgreSQL schema.
  let schema: string | undefined;
  let cleanUrl = connectionString;
  try {
    const url = new URL(connectionString);
    const schemaParam = url.searchParams.get('schema');
    if (schemaParam) {
      schema = schemaParam;
      url.searchParams.delete('schema');
      cleanUrl = url.toString();
    }
  } catch {
    // Invalid URL — fall through with original string
  }
  const pool = new Pool({ connectionString: cleanUrl });
  const adapter = new PrismaPg(pool, schema ? { schema } : undefined);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

let prismaInstance = globalForPrisma.prisma ?? createPrismaClient();

// During long-lived dev sessions, HMR can keep an older Prisma client instance
// that does not include newly-added delegates. Recreate once when detected.
if (!hasRequiredDelegates(prismaInstance)) {
  prismaInstance = createPrismaClient();
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
