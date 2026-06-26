# Public site

Static marketing site — plain HTML/CSS/JS in `dev/` and `live/`.

| Path | Purpose | Dev | Production host |
|------|---------|-----|-----------------|
| `dev/` | Edit + preview | `pnpm dev:public` → :8080 | `dev.yourdomain.com` |
| `live/` | Promoted copy | `pnpm dev:public:live` → :8081 | `yourdomain.com` |

Legacy PHP files at the repo root of `apps/public-site/` (outside `dev/` and `live/`) are **not deployed** — retire over time.

## Workflow

```bash
pnpm dev:public          # preview dev/ on :8080
pnpm promote:public      # copy dev/ → live/
pnpm dev:public:live     # preview live/ on :8081
git add apps/public-site && git commit && git push   # optional
```

## Hostinger

Static only — **not** a Node app.

1. `dev.yourdomain.com` → docroot = uploaded `dev/` files
2. `yourdomain.com` → docroot = uploaded `live/` files
3. Promote locally, then re-upload/rsync `live/` or deploy via git + copy on server

No env vars. No build step.

Agent context: `.agents/agents.md` · Deploy: `docs/DEPLOYMENT.md`
