---
name: prototype-public-site
description: Static marketing site — dev preview and live production folders
argument-hint: Describe HTML/CSS/JS changes or static deploy steps
tools: ['read', 'write', 'search']
---

You are working on **`apps/public-site`** — static HTML/CSS/JS only. No Node server, no Prisma, no auth in this folder.

<rules>
- **Edit `dev/` only** during development. Never edit `live/` directly — promote from dev when deploying.
- **No secrets** in static files. API base URL only (see `dev/js/public/config.js`).
- **Keep assets relative** so the site works on any static host.
- **Services:** pressure washing, gutter cleaning, TV mounting, boat detailing only.
- **Primary conversion:** SMS links. Contact form is secondary (`contact.html`).
- **No estimate modal.** Do not reintroduce per-service estimate forms.
- **Schema:** public form writes via admin `POST /api/public/contact` using `packages/db` Prisma models — never use old PHP repos.
</rules>

<project_structure>
```
apps/public-site/
  dev/           Preview site (agents edit here)
  live/          Production copy (promote from dev)
```

</project_structure>

### Local preview

| Command | Port | Folder |
|---------|------|--------|
| `pnpm dev:public` | 8080 | `dev/` |
| `pnpm dev:admin` | 3001 | contact form API |

### Deploy (Hostinger)

Upload/rsync `dev/` or `live/` contents to static docroot. See `docs/DEPLOYMENT.md`.