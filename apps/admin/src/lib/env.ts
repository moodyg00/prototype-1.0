function pickFirstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

export function getSupabaseUrl(): string {
  const value = pickFirstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL
  );

  if (!value) {
    throw new Error('Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL).');
  }

  return value;
}

export function getSupabasePublishableKey(): string {
  const value = pickFirstDefined(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY
  );

  if (!value) {
    throw new Error(
      'Missing Supabase publishable key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY).'
    );
  }

  return value;
}

export function getDatabaseUrl(): string {
  const value = pickFirstDefined(
    process.env.DATABASE_URL,
    process.env.SUPABASE_DB_URL,
    process.env.SUPABASE_POOLER_URL
  );

  if (!value) {
    throw new Error('Missing database URL. Set DATABASE_URL (or SUPABASE_DB_URL / SUPABASE_POOLER_URL).');
  }

  return value;
}
