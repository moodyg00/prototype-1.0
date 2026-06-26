# proto-2
Refactor of Laravel app to node.js app

## Environment setup (local + Hostinger)

This app already includes Prisma and Supabase clients. You do not need a separate `db.js` file.

### 1) Local development

Copy `.env.example` to `.env.local` and set at least:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

### 2) Hostinger dev and production deployments

In each Hostinger environment, define environment variables in the panel.

Preferred variable names:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Also supported for compatibility:

- `SUPABASE_DB_URL` (or `SUPABASE_POOLER_URL`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`)

When each environment has its own values, switching between dev and prod is automatic at deploy time.

### 3) Verify DB connection after deploy

Open:

- `/api/health/db`

Expected response:

- `{ "ok": true, "database": "connected" }`
