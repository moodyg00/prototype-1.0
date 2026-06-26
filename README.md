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
- Build all: `NODE_OPTIONS=--max-old-space-size=6144 pnpm build`
- Generate Prisma client: `pnpm --filter @prototype/db prisma:generate`
- Typecheck shared/db+media+agent: `pnpm --filter @prototype/db typecheck && pnpm --filter @prototype/media typecheck && NODE_OPTIONS=--max-old-space-size=6144 pnpm --filter @prototype/agent exec tsc --noEmit`

## Database package

- Schema path: `packages/db/prisma/schema.prisma`
- Squashed init migration: `packages/db/prisma/migrations/20260625224500_init/migration.sql`
- Generated client output: `packages/db/generated`

## Current blockers / follow-up

- `@prototype/admin` strict TypeScript checks still fail on a Base UI API mismatch in `components/ui/select.tsx` (`SelectPrimitive.Root.Props` generic signature changed). Build is currently configured to skip lint/type validation while this API update is completed.
- Next.js warns about workspace root due an external lockfile at `/Users/grant/package-lock.json`; functionality is unaffected.
