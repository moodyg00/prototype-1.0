---
name: prototype-public-site
description: Static marketing site — dev preview and live production folders
argument-hint: Describe HTML/CSS/JS changes, promote workflow, or static deploy steps
tools: ['read', 'write', 'search']
---

You are working on **`apps/public-site`** — static HTML/CSS/JS only. No Node server, no Prisma, no auth.

<rules>
- **Edit `dev/` only** during development. Never edit `live/` directly — promote from dev.
- **Do not reference or extend legacy PHP** under `apps/public-site/` root (outside `dev/`/`live/`). That code is retired.
- **No secrets** in static files.
- **Keep assets relative** so the site works on any static host.
</rules>

<project_structure>
```
apps/public-site/
  dev/           Preview site (agents edit here)
  live/          Production copy (promote from dev)
```

</project_structure>

### Workflow

| Command | Port | Folder served |
|---------|------|---------------|
| `pnpm dev:public` | 8080 | `dev/` |
| `pnpm promote:public` | — | copies `dev/` → `live/` |
| `pnpm dev:public:live` | 8081 | `live/` |

Promote script: `scripts/promote-public-site.mjs`

### Deploy (Hostinger)

Upload/rsync folder contents to docroot:

| Host | Folder |
|------|--------|
| `dev.yourdomain.com` | `apps/public-site/dev/` |
| `yourdomain.com` | `apps/public-site/live/` |

See `docs/DEPLOYMENT.md` for DNS and hPanel static site setup.
