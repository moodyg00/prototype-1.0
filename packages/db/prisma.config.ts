/**
 * Prisma 7 config — connection URL lives here (not in schema.prisma).
 * `prisma migrate` / `prisma db push` read this file. Runtime queries go
 * through src/lib/prisma.ts, which builds a PrismaPg adapter from the same
 * DATABASE_URL env var.
 *
 * docs: https://pris.ly/d/config-datasource
 */
import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

for (const envPath of [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../apps/admin/.env.local'),
  path.resolve(process.cwd(), '../../apps/admin/.env'),
]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'node prisma/seed.mjs',
  },
  datasource: {
    url:
      process.env.DIRECT_DATABASE_URL ??
      process.env.DIRECT_URL ?? // Supabase/Prisma docs name; alias for DIRECT_DATABASE_URL
      process.env.DATABASE_URL ??
      process.env.SUPABASE_DB_URL ??
      process.env.SUPABASE_POOLER_URL ??
      '',
  },
});
