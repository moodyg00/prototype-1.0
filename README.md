# prototype-1.0 monorepo

Moody Home Service monorepo:

- `apps/admin` - Next.js admin app (ported from `proto-2`)
- `apps/agent` - Next.js agent app stub (ported from `admin-agent`)
- `apps/public-site` - legacy PHP public site (ported as-is)
- `packages/db` - shared Prisma schema/migrations/generated client
- `packages/media` - shared media storage adapters + service layer
- `packages/tsconfig` - shared TS config presets

## Workspace commands

- Install: `pnpm install`
- Install note: `pnpm install` runs `prisma generate` automatically for `@prototype/db` via the root `postinstall` hook.
- Build all: `NODE_OPTIONS=--max-old-space-size=6144 pnpm build`
- Generate Prisma client: `pnpm --filter @prototype/db prisma:generate`
- Typecheck shared/db+media+agent: `pnpm --filter @prototype/db typecheck && pnpm --filter @prototype/media typecheck && NODE_OPTIONS=--max-old-space-size=6144 pnpm --filter @prototype/agent exec tsc --noEmit`
- Run Admin app: `pnpm dev:admin` (`http://localhost:3001`)
- Run Agent app: `pnpm dev:agent` (`http://localhost:3002`)
- Run Public site (PHP): `pnpm dev:public` (`http://localhost:8080`)

## Database package

- Schema path: `packages/db/prisma/schema.prisma`
- Squashed init migration: `packages/db/prisma/migrations/20260625224500_init/migration.sql`
- Generated client output: `packages/db/generated`
- Generated client is intentionally not committed; regenerate with `pnpm --filter @prototype/db prisma:generate` when needed.

## Media storage adapters

`packages/media` auto-selects storage at runtime:

- `SupabaseStorageAdapter` when both `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY` are set.
- `LocalStorageAdapter` fallback when Supabase is not configured.

Supabase behavior:

- `content/` paths resolve to public URLs.
- `admin_record/` and `submitted/` paths resolve to short-lived signed URLs.
- Optional `SUPABASE_STORAGE_BUCKET` overrides the default bucket name (`media`).

