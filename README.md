# prototype-1.0

Moody Home Service monorepo — admin, agent workspace, background worker, and static public site.

## Apps

| App | Package | Dev port | Role |
|-----|---------|----------|------|
| Admin | `@prototype/admin` | 3001 | Business ops UI (accounting, billing, banking, CRM, settings) |
| Agent | `@prototype/agent` | 3002 | Agent workspace — browser automation, workflows, AI operators |
| Worker | `@prototype/worker` | 3003 | HTTP cron job runner (proxies to admin `/api/cron/*`) |
| Public site | — | 8080 / 8081 | Static HTML in `apps/public-site/dev` and `live` |

## Packages

| Package | Role |
|---------|------|
| `@prototype/db` | Prisma schema, migrations, generated client |
| `@prototype/auth` | Session auth (`proto_session` cookie) — **not** Supabase Auth |
| `@prototype/accounting` | Shared accounting helpers (early extraction) |
| `@prototype/media` | File upload adapters (local + optional Supabase Storage) |
| `@prototype/tsconfig` | Shared TypeScript configs |

Banking logic currently lives in `apps/admin/src/lib/banking/` until extracted to a package.

## Quick start

**Prerequisites:** Node 22, pnpm 11.9.0

```bash
pnpm install
cp apps/admin/.env.example apps/admin/.env.local
cp apps/agent/.env.example apps/agent/.env.local

pnpm --filter @prototype/db prisma migrate deploy
pnpm dev:admin
pnpm dev:agent
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Hostinger setup, env vars, DNS, and cron.

## Workspace commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install deps; runs `prisma generate` via postinstall |
| `pnpm dev:admin` | Admin on :3001 |
| `pnpm dev:agent` | Agent on :3002 |
| `pnpm dev:worker` | Worker on :3003 |
| `pnpm dev:public` | Static dev site on :8080 |
| `pnpm dev:public:live` | Static live preview on :8081 |
| `pnpm promote:public` | Copy `dev/` → `live/` |
| `pnpm build` | Turbo build all apps/packages |
| `pnpm hostinger:admin` | Production build for Hostinger admin deploy |
| `pnpm hostinger:agent` | Production build for Hostinger agent deploy |
| `pnpm hostinger:worker` | Install-only prep for Hostinger worker deploy |

## Database

- Schema: `packages/db/prisma/schema.prisma`
- Migrations: `packages/db/prisma/migrations/`
- Generated client: `packages/db/generated/` (not committed; regenerated on `pnpm install`)
- Migrate: `pnpm --filter @prototype/db prisma migrate deploy`
- Seed: `pnpm --filter @prototype/db prisma:seed`

Local default: `postgresql://postgres:postgres@localhost:5432/prototype`

Production phase 1: Supabase Postgres host only (pooled `DATABASE_URL`, direct `DIRECT_DATABASE_URL` for migrations).

## Auth

Custom sessions via `@prototype/auth` — shared cookie across admin and agent in production (`AUTH_COOKIE_DOMAIN=.yourdomain.com`). No Supabase Auth.

Set `AUTH_REQUIRED=false` locally to skip login.

## Agent context

Per-app guides for AI agents:

- `apps/admin/.agents/agents.md`
- `apps/agent/.agents/agents.md`
