# Worker (`@prototype/worker`)

Minimal Node HTTP server for scheduled jobs. Proxies cron hits to admin API routes.

| | |
|---|---|
| Dev | `pnpm dev:worker` → http://localhost:3003 |
| Package | `@prototype/worker` |
| Depends on | Admin running at `ADMIN_BASE_URL` |

## Setup

```bash
cp apps/worker/.env.example apps/worker/.env.local
# CRON_SECRET must match admin Settings → Business
pnpm dev:worker
```

## Test a job

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3003/jobs/bank-sync
```

Agent context: `.agents/agents.md` · Deploy: `docs/DEPLOYMENT.md`
