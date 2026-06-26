# Deployment architecture

Target: **Hostinger Business** (now) → **KVM VPS** (later) with **minimal code changes**.

## Monorepo layout

```
prototype-1.0/
├── apps/
│   ├── admin/              Next.js — admin.yourdomain.com (:3001 dev)
│   ├── agent/              Next.js — App Lab agent.yourdomain.com (:3002 dev)
│   ├── worker/             Node HTTP job runner (:3003 dev) — crons off Next
│   └── public-site/
│       ├── dev/            Preview static site → dev.yourdomain.com
│       ├── live/           Production static → yourdomain.com
│       └── (legacy PHP)    Retire into dev/ over time
├── packages/
│   ├── auth/               Sessions + cookies (admin + agent)
│   ├── db/                 Prisma schema + migrations
│   └── media/              Upload adapters
└── scripts/
    └── promote-public-site.mjs
```

Four deploy targets, one git repo. **Not** one merged Next app.

## Why a worker app?

| Run on | Good for | Bad for |
|--------|----------|---------|
| **admin Next** | HTTP requests, UI | Mercury sync, long agent jobs, cron bursts |
| **agent Next** | Workspaces, IDE, browser tools | Same — blocks event loop |
| **worker Node** | Cron hits, batch jobs, future vector/memory | UI |

Worker is a tiny HTTP server. Hostinger hPanel cron calls:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://worker.yourdomain.com/jobs/bank-sync
```

Today jobs delegate to admin `/api/cron/*`. Later move heavy logic into `packages/jobs` and call DB directly from worker — admin stays fast.

## Local dev ports

| Command | Port | URL |
|---------|------|-----|
| `pnpm dev:admin` | 3001 | http://localhost:3001 |
| `pnpm dev:agent` | 3002 | http://localhost:3002 |
| `pnpm dev:worker` | 3003 | http://localhost:3003 |
| `pnpm dev:public` | 8080 | http://localhost:8080 (dev static) |
| `pnpm dev:public:live` | 8081 | http://localhost:8081 (live preview) |

```bash
cp apps/admin/.env.example apps/admin/.env.local
cp apps/agent/.env.example apps/agent/.env.local
cp apps/worker/.env.example apps/worker/.env.local   # optional

pnpm --filter @prototype/db prisma migrate deploy
pnpm dev:admin
pnpm dev:agent
pnpm dev:worker   # separate terminal
pnpm dev:public
```

`AUTH_REQUIRED=false` in dev — no login needed unless you flip it.

## Data & auth

| Layer | Choice |
|-------|--------|
| Database | Postgres via Prisma — **same `DATABASE_URL` on admin, agent, worker** |
| Dev DB | Local Postgres |
| Prod DB (phase 1) | Supabase Postgres host only — **no Supabase Auth** |
| Prod DB (phase 2) | Postgres on KVM — change `DATABASE_URL` only |
| Auth | `user_sessions` table + cookie `proto_session` via `@prototype/auth` |
| Cross-subdomain | `AUTH_COOKIE_DOMAIN=.yourdomain.com` on admin + agent |

## Auth routes (admin + agent — identical)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Sign in |
| `/api/auth/session` | GET / DELETE | Current user / sign out |
| `/api/auth/invite/[token]` | GET/POST | Admin invite only |

Sign in on either app → same cookie in production → open the other app without re-login.

## Static site workflow

```bash
# Edit apps/public-site/dev/
pnpm dev:public
pnpm promote:public              # dev/ → live/
pnpm dev:public:live             # verify live/
git push                         # optional history
```

On Hostinger: upload/rsync `dev/` and `live/` folders to subdomain docroots. No Node.

## Hostinger subdomains & DNS

Use **five separate hPanel websites** (Add website per hostname). Do **not** use Domains → Subdomains under one site — that only creates a subfolder, not separate apps.

| Host | hPanel website type |
|------|---------------------|
| `yourdomain.com` | Custom PHP/HTML → upload `public-site/live/` |
| `dev.yourdomain.com` | Custom PHP/HTML → upload `public-site/dev/` |
| `admin.yourdomain.com` | Node.js Web App |
| `agent.yourdomain.com` | Node.js Web App |
| `worker.yourdomain.com` | Node.js Web App (optional) |

**DNS at Hostinger (nameservers on Hostinger):** records are usually auto-created when you add each website. Wait a few minutes for propagation.

**DNS at external registrar:** one **A record** per hostname → your Hostinger hosting IP (hPanel → Plan Details):

| Type | Name | Value |
|------|------|-------|
| A | `@` | hosting IP |
| A | `www` | hosting IP (or CNAME `www` → `@`) |
| A | `dev` | hosting IP |
| A | `admin` | hosting IP |
| A | `agent` | hosting IP |
| A | `worker` | hosting IP (if exposed) |

Remove conflicting old A/CNAME for `@` and `www` before switching. Keep MX/SPF if email stays external.

**Node quirk:** if a hostname already has a non-Node website, delete it (backup first), then Add website → Node.js Web App.

## Hostinger Business — GitHub deploy (monorepo)

Connect **same repo** three times as separate Node websites (uses 3 of 5 Business Node slots).

### Shared settings (all Node apps)

- **Install command** (from repo root):  
  `pnpm install --frozen-lockfile`
- **Node version**: 22

### Admin (`admin.yourdomain.com`)

Hostinger’s build wizard is **dropdown-only** (reads root `package.json` scripts). Webroot stays `./` (repo root) — that’s OK.

| Setting | Value |
|---------|-------|
| Build command (dropdown) | **`hostinger:admin`** |
| Output directory | `apps/admin/.next` |
| Framework | Next.js |
| Node | 22 |

**Env vars:** see `apps/admin/.env.example` + `AUTH_REQUIRED=true`, Supabase `DATABASE_URL`, etc.

### Agent (`agent.yourdomain.com`)

| Setting | Value |
|---------|-------|
| Build command (dropdown) | **`hostinger:agent`** |
| Output directory | `apps/agent/.next` |
| Framework | Next.js |

**Env vars:** same `DATABASE_URL`, `AUTH_*` as admin.  
`NEXT_PUBLIC_APP_URL=https://agent.yourdomain.com`

### Worker (`worker.yourdomain.com` or internal subdomain)

| Setting | Value |
|---------|-------|
| Build command (dropdown) | **`hostinger:worker`** (install only) |
| Start command | `pnpm --filter @prototype/worker start` |
| Framework | Other → entry `apps/worker/src/index.ts` |

**Env vars:**

```env
WORKER_PORT=3003
CRON_SECRET=<same as admin system settings>
ADMIN_BASE_URL=https://admin.yourdomain.com
```

**hPanel cron** (every 15 min example):

```bash
curl -sS -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://worker.yourdomain.com/jobs/bank-sync
```

### Public site (not GitHub Node — static upload)

| Host | Source folder in repo |
|------|----------------------|
| `dev.yourdomain.com` | `apps/public-site/dev/` |
| `yourdomain.com` | `apps/public-site/live/` |

Deploy via FTP, File Manager, or git pull + copy on server. No build step.

## Supabase (Postgres only, when you deploy)

1. Create project.
2. Migrate: `DIRECT_DATABASE_URL=... pnpm --filter @prototype/db prisma migrate deploy`
3. Set pooled `DATABASE_URL` on admin, agent, worker.

## KVM VPS (phase 2)

Same code. Swap hPanel Node → nginx + systemd. Worker becomes a real background service. Postgres moves on-box.

| Unit | Role |
|------|------|
| `proto-admin.service` | Next admin |
| `proto-agent.service` | Next App Lab |
| `proto-worker.service` | Job runner |
| nginx | Static + reverse proxy |

## Checklists

**Local → Hostinger**

- [ ] Supabase + migrations
- [ ] Deploy admin, agent, worker Node apps
- [ ] Upload `public-site/dev` + `live`
- [ ] `AUTH_REQUIRED=true` on admin + agent
- [ ] Cron → worker `/jobs/bank-sync`
- [ ] Invite first user

**Hostinger → KVM**

- [ ] Postgres on VPS, update `DATABASE_URL`
- [ ] nginx + systemd
- [ ] Same env vars, same repo

## Commands

```bash
pnpm --filter @prototype/db prisma migrate deploy
pnpm prisma:generate
pnpm promote:public
pnpm --filter @prototype/admin integrations:bootstrap
```
