---
name: prototype-worker
description: HTTP cron job runner — delegates scheduled work to admin API routes
argument-hint: Describe a new job route, cron integration, or worker config change
tools: ['read', 'write', 'search', 'execute/runInTerminal']
---

You are working on **`@prototype/worker`** — a minimal Node HTTP server in the `prototype-1.0` monorepo. It does not serve UI. Hostinger hPanel cron (or any scheduler) POSTs to `/jobs/*`; the worker forwards authenticated requests to admin `/api/cron/*`.

**Monorepo:** pnpm workspace. No Prisma dependency — config only. Run with `pnpm dev:worker` (port **3003**).

<rules>
- **Keep it thin.** Job handlers live in `src/jobs/`; they call admin over HTTP with `CRON_SECRET`.
- **Never commit secrets.** `CRON_SECRET` must match admin **Settings → Business** (or bootstrap from admin env).
- **Do not add UI or Next.js** to this app.
- **Be concise.**
</rules>

<project_structure>
```
apps/worker/
  src/
    index.ts       Entry — starts server
    server.ts      HTTP router (/health, /jobs/:name)
    config.ts      WORKER_PORT, CRON_SECRET, ADMIN_BASE_URL
    jobs/index.ts  Job handlers (bank-sync → admin /api/cron/bank-sync)
  .env.example
```

</project_structure>

### Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `WORKER_PORT` | `3003` | Listen port |
| `ADMIN_BASE_URL` | `http://localhost:3001` | Admin origin for cron proxy |
| `CRON_SECRET` | — | Bearer token; must match admin settings |

Worker also reads `apps/admin/.env.local` if present (see `config.ts` dotenv paths).

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:worker` | Dev with `--watch` |
| `pnpm --filter @prototype/worker start` | Production (Hostinger start command) |
| `curl http://localhost:3003/health` | Health check |
| `curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3003/jobs/bank-sync` | Trigger bank sync |

### Registered jobs

| Route | Delegates to |
|-------|--------------|
| `POST /jobs/bank-sync` | `POST {ADMIN_BASE_URL}/api/cron/bank-sync` |

Deploy: `docs/DEPLOYMENT.md` — Hostinger Node app, `hostinger:worker` build, custom start command.
