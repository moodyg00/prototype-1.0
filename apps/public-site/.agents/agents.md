---
name: prototype-public-site
description: Live static marketing site docroot (simulates public_html locally)
argument-hint: Describe deploy or static-site verification steps
tools: ['read', 'search']
---

You are working on **`apps/public-site`** — the **live** static docroot. Plain HTML/CSS/JS only.

<rules>
- **Do not edit here during development.** Edit projects in `apps/public-dev/sites/<slug>/` and deploy via the public-dev IDE (or `pnpm promote:public`).
- This folder mirrors what is served at `www` / `public_html` in production.
- **No secrets** in static files. Contact form uses admin `POST /api/public/contact`.
- **Keep asset paths relative** so the site works on any static host.
</rules>

<project_structure>
```
apps/public-site/          ← live docroot (you are here)
apps/public-dev/sites/     ← editable projects (IDE source)
```

</project_structure>

### Local preview

| Command | Port | Folder |
|---------|------|--------|
| `pnpm dev:public` | 8080 | `apps/public-site/` |
| `pnpm dev:public-dev` | 3004 | IDE + `/preview/<slug>/` |

### Production

Upload/rsync this folder's contents to the main domain `public_html`, or deploy from public-dev over SFTP.
