# Architecture

## Overview

**`@prototype/admin`** is a Next.js 15 App Router app in the `prototype-1.0` monorepo — business operations where humans and AI agents share one Postgres database via `@prototype/db`. `/` redirects to `/admin`.

Sibling apps: `@prototype/agent` (agent workspace, port 3002), `@prototype/worker` (cron runner, port 3003), static `apps/public-site`.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 · PostgreSQL · pnpm · Node 22

## Monorepo layout

```
apps/admin/                 This app
packages/db/                Prisma schema, migrations, generated client
packages/auth/              Session auth (proto_session cookie)
packages/media/             Upload adapters
packages/accounting/          Shared accounting helpers (early extraction)
```

Banking logic remains in `apps/admin/src/lib/banking/` until extracted.

## App layout

```
app/
  admin/                Admin UI (accounting, billing, banking, calendar, CRM, design library)
  api/                  Server endpoints (admin CRUD, auth, cron, webhooks, health)
  auth/                 Login
components/
  ui/                   COSS primitives
  design/explorations/  Design library source (add-component skill)
  admin/                Billing editors, shared widgets
middleware.ts           Auth (@prototype/auth)
src/
  components/admin/     Domain workspaces
  lib/                  Business logic
  agents/               Agent runtime bootstrap
  core/                 Agent memory and tasks
```

**Layering:** UI in pages/components. Business logic in `src/lib/`. API routes validate with Zod and call services. Prisma only on server via `@prototype/db`.

## Admin UI

- **Entry:** `/admin` — sidebar with domain sections
- **Design library:** `/admin/design` — slugs in `src/design/manifest.ts`
- **UI foundation:** COSS in `components/ui/`; Tailwind v4 via PostCSS (`app/globals.css`)
- **Generic CRUD:** `app/admin/[section]/` + `src/lib/admin-record-operations.ts`

## Data layer

- **Schema:** `packages/db/prisma/schema.prisma`
- **Client:** `@prototype/db` — generated to `packages/db/generated/` (regenerated on `pnpm install`)
- **App client:** `src/lib/prisma.ts` with PrismaPg adapter + audit extension → `ChangeLog`
- **Migrations:** `pnpm --filter @prototype/db prisma migrate deploy`
- **Document numbering:** Postgres sequences `JE`, `INV`, `EST`, `WO` — `src/lib/accounting/numbering.ts`

## Auth

Custom sessions via `@prototype/auth`:

- Cookie: `proto_session` (configurable via `AUTH_COOKIE_NAME`)
- Table: `user_sessions`
- Middleware: `middleware.ts` → `src/lib/auth/middleware.ts`
- Protected: `/admin`, `/api/admin`, `/api/tasks`, `/api/agent-demo`
- Public: `/auth/login`, `/api/auth/*`, `/api/health/*`, `/api/book/*`, `/api/webhooks/*`, `/api/cron/*`
- Shared with agent app in production via `AUTH_COOKIE_DOMAIN=.yourdomain.com`

**Not** Supabase Auth.

## Domain modules (`src/lib/`)

| Module | Path | Responsibility |
|--------|------|----------------|
| Accounting | `accounting/` | Journal entries, ledger, reports, money |
| Banking | `banking/` | Mercury sync, rules, JE from transactions |
| Billing | `billing/` | Estimates, invoices, totals |
| Operations | `operations/` | Work orders, products, services |
| Scheduling | `scheduling/` | Calendar, booking links, public booking |
| Integrations | `integrations/` | API integrations + system settings from DB |
| Mercury | `mercury/` | Mercury client, webhooks, mappers |
| Email | `email/` | Provider config, send |
| Validation | `validation/` | Zod schemas |
| Auth | `auth/` | App-specific session/invite wrappers |

## API routes

| Prefix | Purpose |
|--------|---------|
| `app/api/admin/` | Admin CRUD and domain actions |
| `app/api/auth/` | Login, session, invites |
| `app/api/book/[token]/` | Public booking (unauthenticated) |
| `app/api/webhooks/mercury/` | Mercury webhook |
| `app/api/cron/bank-sync/` | Bank sync (Bearer `CRON_SECRET`) |
| `app/api/health/db/` | DB connectivity |

Cron secret: stored in DB (Settings → Business), env `CRON_SECRET` for worker/bootstrap.

## Credentials

Server-side only — stored in Postgres:

- Admin → API integrations
- Settings modules (system, email, business)
- Bootstrap: `pnpm --filter @prototype/admin integrations:bootstrap`

Env holds: `DATABASE_URL`, `AUTH_*`, `NEXT_PUBLIC_*`.

## Deploy

See repo root `docs/DEPLOYMENT.md` — Hostinger Node app, `hostinger:admin` build, output `apps/admin/.next`, standalone via `next.config.mjs`.
