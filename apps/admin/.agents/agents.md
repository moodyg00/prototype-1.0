---
name: prototype-admin
description: Business operations admin — accounting, billing, banking, CRM, scheduling, settings
argument-hint: Describe a feature, admin screen, API route, or business logic change
tools: ['read', 'write', 'search', 'vscode/memory', 'execute/runInTerminal', 'execute/getTerminalOutput', 'vscode/askQuestions', 'agent']
agents: ['Explore']
---

You are working on **`@prototype/admin`** — the business operations app in the `prototype-1.0` monorepo. It provides admin UI for CRUD, accounting, billing, banking sync, scheduling, and business automation. `/` redirects to `/admin`.

**Monorepo:** pnpm workspace at repo root. Shared packages: `@prototype/db`, `@prototype/auth`, `@prototype/media`. Run from repo root with `pnpm --filter @prototype/admin <script>` or `pnpm dev:admin`.

**Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 · PostgreSQL · Node 22 · pnpm 11.9.0

<rules>
- **Start from the design library for admin UI.** Browse `/admin/design` (`app/admin/design/`). Slugs in `src/design/manifest.ts`; variants in `components/design/explorations/`. Install with the `add-component` skill (`.agents/skills/add-component/SKILL.md`).
- **COSS primitives** in `components/ui/` — no shadcn/Radix-only wrappers. Run `pnpm --filter @prototype/admin verify:coss-ui` when changing primitives.
- **Credentials stay server-side.** API keys, webhook secrets, cron secret, and integration config live in the database (`Admin → API integrations`, Settings). Run `pnpm --filter @prototype/admin integrations:bootstrap` once to import legacy `.env.local` values. Only `DATABASE_URL`, `AUTH_*`, and `NEXT_PUBLIC_*` stay in env.
- **Auth is wired.** `middleware.ts` protects `/admin`, `/api/admin`, `/api/tasks`, `/api/agent-demo` via `@prototype/auth`. Set `AUTH_REQUIRED=false` locally to skip login. Production uses `user_sessions` + `proto_session` cookie — **not** Supabase Auth.
- **Schema lives in the monorepo.** Edit `packages/db/prisma/schema.prisma`; migrate with `pnpm --filter @prototype/db prisma migrate dev`. Prisma client: `@prototype/db`.
- **Validate API inputs** with Zod in `src/lib/validation/`.
- **Be concise.** No unnecessary comments or scaffolding.
</rules>

<workflow>
## 1. Discovery
Use Explore to find existing patterns, Prisma models, validation schemas, and affected routes.

## 2. Design
- **UI** → `app/admin/` or `src/components/admin/` / `components/admin/`
- **Business logic** → `src/lib/` (accounting, banking, billing, operations, scheduling)
- **Shared auth** → `@prototype/auth` (app wrappers in `src/lib/auth/`)
- **Data** → `packages/db/prisma/`
- **API** → `app/api/admin/` or `app/api/`

## 3. Implementation
- Business logic in `src/lib/`; UI in components; routes orchestrate
- Document numbers from Postgres sequences (`JE`, `INV`, `EST`, `WO`) — `src/lib/accounting/numbering.ts`
- After edits: `pnpm --filter @prototype/admin typecheck`

## 4. Verification
- Dev server: `pnpm dev:admin` → http://localhost:3001
- DB health: `curl http://localhost:3001/api/health/db`
- Auth off locally: `AUTH_REQUIRED=false` in `apps/admin/.env.local`
</workflow>

<capabilities>
- Admin pages, design library, COSS UI, API routes, `src/lib/` business logic
- Prisma via `@prototype/db` — migrate from repo root
- Accounting, billing, banking (Mercury), scheduling, integrations
- Session auth and invites via `@prototype/auth`
- Agent demo runtime under `src/agents/` and `src/core/`
</capabilities>

<project_structure>
```
apps/admin/
  app/
    admin/              Admin UI pages
    api/                Routes (admin CRUD, auth, cron, webhooks, health)
    auth/               Login page
  components/           COSS ui/, design/explorations/, admin/
  middleware.ts         Auth gate (@prototype/auth)
  src/
    components/admin/   Domain workspaces
    lib/                Business logic + auth wrappers
    agents/             Agent runtime bootstrap
    core/               Agent memory/tasks
packages/db/            Prisma schema + migrations (shared)
packages/auth/          Session auth (shared)
packages/media/         Upload adapters (shared)
```
</project_structure>

---

### Environment and commands

| Variable / command | Notes |
|--------------------|-------|
| Port | **3001** (`pnpm dev:admin`) |
| `DATABASE_URL` | Postgres connection (same as agent) |
| `DIRECT_DATABASE_URL` | Direct URL for Prisma CLI migrations |
| `AUTH_REQUIRED` | `false` locally; `true` in production |
| `AUTH_SECRET`, `AUTH_COOKIE_DOMAIN` | Production session config |
| `CRON_SECRET` | Bootstrap to DB; also set on worker. UI: **Settings → Business** |
| `pnpm dev:admin` | Dev server |
| `pnpm --filter @prototype/admin typecheck` | TypeScript |
| `pnpm --filter @prototype/admin integrations:bootstrap` | Import env secrets → DB |
| `pnpm --filter @prototype/db prisma migrate deploy` | Apply migrations |

**First-time DB:** `pnpm --filter @prototype/db prisma migrate deploy` → optional `pnpm --filter @prototype/db prisma:seed`

### Naming map (UI → code)

| UI label | Model / route |
|----------|---------------|
| Catalog | `Product` / `/api/admin/products` |
| Offerings | `Service` / `/api/admin/offerings` |
| API integrations | `Integration` |
| Credentials | `Credential` |
| Log | `ChangeLog` |

Deploy details: `docs/DEPLOYMENT.md` at repo root.
