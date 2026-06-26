# AGENTS.md

Project-wide agent guidance also lives in `.agents/agents.md`. This file adds environment-specific notes for Cursor Cloud agents.

## Cursor Cloud specific instructions

### Product in this repo

Single deployable app: **proto-2** (Next.js 15 App Router). `/` redirects to `/admin`. Package manager is **npm** (`package-lock.json`). Node **22** (`.nvmrc`). TypeScript **`strict: false`**. See `README.md` for env var names.

### Services

| Service | Required | Notes |
|---------|----------|--------|
| Next.js dev server | Yes | `npm run dev` → http://localhost:3000 (runs Tailwind CSS pre-build, then `next dev`) |
| PostgreSQL 16+ | Yes for DB-backed routes | Not bundled in the repo; no `docker-compose`. Local default in `.env.example`: `postgresql://postgres:postgres@localhost:5432/proto2` |

### PostgreSQL on the VM

PostgreSQL is a **system** service, not started by `npm run dev`. If `pg_isready` fails:

```bash
sudo pg_ctlcluster 16 main start
```

Create the DB once (if missing): `sudo -u postgres createdb proto2` and set the `postgres` role password to match `.env.local` if you use password auth.

Copy env: `cp .env.example .env.local` and set `DATABASE_URL` at minimum.

### First-time database setup (fresh empty DB)

On a **new** database:

1. `npx prisma migrate deploy` — applies all migrations in `prisma/migrations/` (init schema + sequences + domain additions)
2. If migrate fails on an empty DB, run `npx prisma db push` once, then `npx prisma migrate deploy`
3. `npm run prisma:seed` — optional demo data

Verify: `curl http://localhost:3000/api/health/db` → `{"ok":true,"database":"connected"}`.

### Standard commands (from `package.json`)

- **Dev:** `npm run dev` (use tmux for long-running processes)
- **Typecheck:** `npm run typecheck`
- **COSS UI check:** `npm run verify:coss-ui`
- **Build:** `npm run build` (Tailwind CLI + `next build`, standalone output)
- **Prisma:** `npm run prisma:generate`, `npm run prisma:migrate`, `npm run prisma:seed`, `npm run prisma:studio`
- **Integrations bootstrap:** `npm run integrations:bootstrap` — one-time import of legacy `.env.local` secrets into DB

### Lint

`npm run lint` runs `next lint`, which currently prompts for interactive ESLint setup because there is no `eslint.config.*` in the repo. Use `npm run typecheck` and `npm run verify:coss-ui` as the reliable static checks until ESLint is configured.

### Non-obvious dev notes

- Tailwind v4 is pre-compiled to `app/globals.built.css` on every `dev`/`build` via `npm run build:css`; if styles look stale, restart dev or rerun `build:css`.
- Prisma client output is committed under `generated/`; rerun `npm run prisma:generate` after schema changes.
- API keys (Mercury, OpenAI, etc.), webhook secrets, and cron auth live in the **database** (`Admin → API integrations` and `settings` module `system`). Outbound email lives in `settings` module `email` — configure at **Admin → Settings → Email Provider**. Run `npm run integrations:bootstrap` once to import legacy `.env.local` values. `DATABASE_URL` and `NEXT_PUBLIC_*` stay in env.
- OpenAI integration is optional; agent demo APIs work without it.
- **Auth is not wired yet** — no root `middleware.ts`; admin APIs are open during development. Add Supabase middleware before production.
- **Naming map (UI → code):** Catalog = `Product` / `/api/admin/products`; Offerings = `Service` / `/api/admin/offerings`; API integrations = `Integration`; Credentials = `Credential`; Log = `ChangeLog`.

### Document numbering

Shared Postgres sequences allocate numbers for journal entries (`JE`), invoices (`INV`), estimates (`EST`), and work orders (`WO`). See `src/lib/accounting/numbering.ts`.
