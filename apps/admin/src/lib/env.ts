function pickFirstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

/** Postgres connection string for Prisma runtime + CLI. */
export function getDatabaseUrl(): string {
  const value = pickFirstDefined(
    process.env.DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.SUPABASE_POOLER_URL,
  );

  if (!value) {
    throw new Error(
      'Missing database URL. Set DATABASE_URL (local dev) or Supabase pooled URL in production.',
    );
  }

  return value;
}

/** Direct Postgres URL for migrations (Supabase port 5432). Falls back to DATABASE_URL. */
export function getDirectDatabaseUrl(): string {
  return (
    pickFirstDefined(process.env.DIRECT_DATABASE_URL, process.env.DIRECT_URL, process.env.DATABASE_URL) ??
    getDatabaseUrl()
  );
}

/** True when DATABASE_URL points at Supabase pooler/host. */
export function isSupabaseDatabaseUrl(url: string = getDatabaseUrl()): boolean {
  return url.includes('supabase');
}
