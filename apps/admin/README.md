# Admin (`@prototype/admin`)

Next.js business operations app — accounting, billing, banking, CRM, scheduling, settings.

| | |
|---|---|
| Dev | `pnpm dev:admin` → http://localhost:3001 |
| Package | `@prototype/admin` |
| Auth | `@prototype/auth` — set `AUTH_REQUIRED=false` locally |
| Database | `@prototype/db` — schema in `packages/db/` |

## Key paths

- UI: `app/admin/`
- API: `app/api/`
- Business logic: `src/lib/`
- Auth wrapper: `src/lib/auth/`, `middleware.ts`
- Design library: `/admin/design`

## Commands

```bash
pnpm --filter @prototype/admin typecheck
pnpm --filter @prototype/admin integrations:bootstrap
pnpm --filter @prototype/db prisma migrate deploy
```

Agent context: `.agents/agents.md` · Deploy: `docs/DEPLOYMENT.md`
