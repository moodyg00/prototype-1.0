# Deployment

Target: **Hostinger Business** (now) → **KVM VPS** (later), same repo and env vars.

## Monorepo layout

```
prototype-1.0/
├── apps/
│   ├── admin/           Next.js — admin.yourdomain.com (:3001 dev)
│   ├── agent/           Next.js — agent.yourdomain.com (:3002 dev)
│   ├── worker/          Node HTTP job runner (:3003 dev)
│   └── public-site/
│       ├── dev/         Preview static → dev.yourdomain.com
│       └── live/        Production static → yourdomain.com
├── packages/
│   ├── auth/            Session cookies (@prototype/auth)
│   ├── db/              Prisma schema + migrations
│   ├── accounting/      Shared accounting helpers (extracting from admin)
│   ├── media/           Upload adapters (local + optional Supabase Storage)
│   └── tsconfig/        Shared TS presets
└── scripts/
    └── promote-public-site.mjs
```

Four deploy targets, one git repo. **Not** one merged Next app.

## Why a worker app?

| Run on | Good for | Bad for |
|--------|----------|---------|
| **admin Next** | HTTP, UI, webhooks | Long cron bursts, heavy batch jobs |
| **agent Next** | Workspaces, browser tools | Same — blocks event loop |
| **worker Node** | Scheduled jobs, future batch work | UI |

Worker is a small HTTP server. Hostinger hPanel cron (or any scheduler) calls:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://worker.yourdomain.com/jobs/bank-sync
```

Jobs delegate to admin `/api/cron/*` today. Heavy logic can move into shared packages later so admin stays fast.

## Local dev

| Command | Port | URL |
|---------|------|-----|
| `pnpm dev:admin` | 3001 | http://localhost:3001 |
| `pnpm dev:agent` | 3002 | http://localhost:3002 |
| `pnpm dev:worker` | 3003 | http://localhost:3003 |
| `pnpm dev:public` | 8080 | http://localhost:8080 (dev static) |
| `pnpm dev:public:live` | 8081 | http://localhost:8081 (live preview) |

**Prerequisites:** Node 22 (`.nvmrc`), pnpm 11.9.0 (`packageManager` in root `package.json`).

```bash
pnpm install

cp apps/admin/.env.example apps/admin/.env.local
cp apps/agent/.env.example apps/agent/.env.local
cp apps/worker/.env.example apps/worker/.env.local   # optional locally

# Local Postgres (example)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prototype
# DIRECT_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prototype

pnpm --filter @prototype/db prisma migrate deploy
pnpm dev:admin    # terminal 1
pnpm dev:agent    # terminal 2
pnpm dev:worker   # terminal 3 — optional unless testing cron
pnpm dev:public   # terminal 4 — optional
```

Set `AUTH_REQUIRED=false` in dev to skip login. Production: `AUTH_REQUIRED=true` on admin and agent.

## Data & auth

| Layer | Choice |
|-------|--------|
| Database | Postgres via Prisma — **same `DATABASE_URL` on admin, agent, worker** (worker reads admin URL for job proxy only) |
| Dev DB | Local Postgres |
| Prod DB (phase 1) | Supabase **Postgres host only** — no Supabase Auth |
| Prod DB (phase 2) | Postgres on KVM — change `DATABASE_URL` only |
| Auth | `user_sessions` + cookie `proto_session` via `@prototype/auth` |
| Cross-subdomain | `AUTH_COOKIE_DOMAIN=.yourdomain.com` on admin + agent |

**Env var names (database):**

| Variable | Used by | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | admin, agent, migrations (runtime) | Pooled connection (port 6543 on Supabase) |
| `DIRECT_DATABASE_URL` | `pnpm --filter @prototype/db prisma migrate deploy` | Direct connection (port 5432) for migrations |

Prisma config: `packages/db/prisma.config.ts` reads `DIRECT_DATABASE_URL` first for CLI.

**Auth env (admin + agent):**

| Variable | Notes |
|----------|-------|
| `AUTH_REQUIRED` | `true` in production |
| `AUTH_SECRET` | Set in Hostinger panel |
| `AUTH_COOKIE_DOMAIN` | `.yourdomain.com` in production; omit on localhost |
| `NEXT_PUBLIC_APP_URL` | Public URL of that app |

**Cron secret:**

| Where | Variable |
|-------|----------|
| Admin UI | **Settings → Business** → Cron secret (stored in DB) |
| Worker | `CRON_SECRET` env — must match admin setting |
| Cron HTTP | `Authorization: Bearer <CRON_SECRET>` |

Configure via admin UI, or bootstrap once with `CRON_SECRET` in `apps/admin/.env.local` and run `pnpm --filter @prototype/admin integrations:bootstrap`.

## Auth routes (admin + agent)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Sign in |
| `/api/auth/session` | GET / DELETE | Current user / sign out |
| `/api/auth/invite/[token]` | GET / POST | Invite accept (admin) |

Sign in on either app → shared cookie in production → open the other app without re-login.

## Static site workflow

```bash
# Edit apps/public-site/dev/
pnpm dev:public
pnpm promote:public      # dev/ → live/
pnpm dev:public:live     # verify live/
git push                 # optional history
```

Hostinger: upload/rsync `dev/` and `live/` to subdomain docroots. No Node build.

## Hostinger subdomains & DNS

Use **separate hPanel websites** (Add website per hostname). Do **not** use Domains → Subdomains under one site — that only creates a subfolder.

| Host | hPanel website type |
|------|---------------------|
| `yourdomain.com` | Custom PHP/HTML → upload `public-site/live/` |
| `dev.yourdomain.com` | Custom PHP/HTML → upload `public-site/dev/` |
| `admin.yourdomain.com` | Node.js Web App |
| `agent.yourdomain.com` | Node.js Web App |
| `worker.yourdomain.com` | Node.js Web App |

**DNS at Hostinger:** records usually auto-create when you add each website.

**DNS at external registrar:** one **A record** per hostname → Hostinger hosting IP (hPanel → Plan Details):

| Type | Name | Value |
|------|------|-------|
| A | `@` | hosting IP |
| A | `www` | hosting IP (or CNAME `www` → `@`) |
| A | `dev` | hosting IP |
| A | `admin` | hosting IP |
| A | `agent` | hosting IP |
| A | `worker` | hosting IP |

Remove conflicting old A/CNAME for `@` and `www` before switching. Keep MX/SPF if email stays external.

**Node quirk:** if a hostname already has a non-Node website, delete it (backup first), then Add website → Node.js Web App.

## Hostinger Business — GitHub deploy

Connect the **same repo** three times as separate Node websites (3 of 5 Business Node slots).

### Shared settings (all Node apps)

| Setting | Value |
|---------|-------|
| Install command | `pnpm install --frozen-lockfile` |
| Node version | 22 |
| pnpm | 11.9.0 via Corepack — root `packageManager` must match |

`pnpm-workspace.yaml` sets `minimumReleaseAge: 0` and `allowBuilds` for pnpm 11 CI (Prisma, sharp, etc.).

### Admin (`admin.yourdomain.com`)

Build wizard is **dropdown-only** (reads root `package.json` scripts). Webroot stays repo root.

| Setting | Value |
|---------|-------|
| Framework | **Other** |
| Entry file | `server.js` or `scripts/hostinger-serve-admin.mjs` (both generated inside `apps/admin/.next` at build time) |
| Build command | `build` (requires `HOSTINGER_APP=admin`) or `hostinger:admin` |
| Output directory | `apps/admin/.next` |
| Node | 22 |

Env: see `apps/admin/.env.example` — `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_*`, `AUTH_REQUIRED=true`, `NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com`, **`HOSTINGER_APP=admin`** (if build command is `build`).

### Agent (`agent.yourdomain.com`)

| Setting | Value |
|---------|-------|
| Framework | **Other** |
| Entry file | `server.js` or `scripts/hostinger-serve-agent.mjs` (both generated inside `apps/agent/.next` at build time) |
| Build command | `build` (requires `HOSTINGER_APP=agent`) or `hostinger:agent` |
| Output directory | `apps/agent/.next` |
| Node | 22 |

Same `DATABASE_URL` and `AUTH_*` as admin. `NEXT_PUBLIC_APP_URL=https://agent.yourdomain.com`, **`HOSTINGER_APP=agent`** (if build command is `build`).

### Worker (`worker.yourdomain.com`)

| Setting | Value |
|---------|-------|
| Build command | `hostinger:worker` (install only) |
| Start command | `hostinger:worker:start` |
| Framework | Other → entry `apps/worker/src/index.ts` |

```env
WORKER_PORT=3003
CRON_SECRET=<same as admin Settings → Business>
ADMIN_BASE_URL=https://admin.yourdomain.com
```

**hPanel cron** (every 15 min example):

```bash
curl -sS -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://worker.yourdomain.com/jobs/bank-sync
```

Health check: `GET https://worker.yourdomain.com/health`

### Public site (static — not GitHub Node)

| Host | Source folder |
|------|---------------|
| `dev.yourdomain.com` | `apps/public-site/dev/` |
| `yourdomain.com` | `apps/public-site/live/` |

Deploy via FTP, File Manager, or git pull + copy. No build step.

## Supabase (Postgres only)

1. Create Supabase project (database only — **do not** enable Supabase Auth).
2. Set `DIRECT_DATABASE_URL` (port 5432) and run migrations from repo root:

   ```bash
   DIRECT_DATABASE_URL='postgresql://...' pnpm --filter @prototype/db prisma migrate deploy
   ```

3. Set pooled `DATABASE_URL` (port 6543) on admin and agent Hostinger env panels.

## KVM VPS (phase 2)

Same code. Replace hPanel Node apps with nginx + systemd. Postgres moves on-box.

| Unit | Role |
|------|------|
| `proto-admin.service` | Next admin |
| `proto-agent.service` | Next agent |
| `proto-worker.service` | Job runner |
| nginx | Static + reverse proxy |

## Checklists

**Local → Hostinger**

- [ ] Supabase Postgres project + migrations applied
- [ ] Deploy admin, agent, worker Node apps from GitHub
- [ ] Upload `public-site/dev` + `live`
- [ ] `AUTH_REQUIRED=true`, `AUTH_COOKIE_DOMAIN`, `AUTH_SECRET` on admin + agent
- [ ] `CRON_SECRET` in admin Settings → Business **and** worker env
- [ ] hPanel cron → worker `/jobs/bank-sync`
- [ ] Invite first user (admin)

**Hostinger → KVM**

- [ ] Postgres on VPS, update `DATABASE_URL`
- [ ] nginx + systemd units
- [ ] Same env vars, same repo

## Commands

```bash
pnpm install
pnpm --filter @prototype/db prisma migrate deploy
pnpm prisma:generate
pnpm promote:public
pnpm --filter @prototype/admin integrations:bootstrap
pnpm hostinger:admin    # local production build smoke test
```
