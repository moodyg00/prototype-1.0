# @prototype/public-dev

A lightweight, static-site IDE (intended for `dev.mysite.com`) for editing multiple
plain **HTML/CSS/JS** projects and deploying them to a live web docroot.

- **No build step, no framework output.** Every project is plain static files.
- **Monaco editor** + tabbed workspace, **scoped agent chat**, file tree.
- **Live preview** at `/preview/<slug>/` on the same Node app (not a separate server).
- **Safe deploy**: dry-run → optional backup → explicit confirmation → copy (local) or SFTP (production).

## Layout

```
apps/public-dev/
  sites/<slug>/          ← editable projects (IDE reads/writes here)
  app/preview/...        ← serves sites/<slug>/ for in-IDE preview
  .deploy/               ← backups + audit log (gitignored)

apps/public-site/        ← live docroot simulation (→ public_html in production)
```

| Path | Role |
|------|------|
| `apps/public-dev/sites/<slug>/` | Source while editing |
| `apps/public-site/` | Deploy target locally (`DEPLOY_LIVE_HOST=local`) |
| Remote `public_html` | Deploy target in production (SFTP) |

---

## Architecture

```
apps/public-dev/
  sites/<slug>/                    # project files + .project.json
  app/
    preview/[slug]/[[...path]]/    # static preview route
    api/projects/...               # file CRUD, agent, deploy
  src/lib/projects.ts              # path-scoped file access
  src/lib/deploy.ts                # local copy or SSH/SFTP
```

### Security model
- File paths pass through `resolveInProject()` — no traversal outside `sites/<slug>/`.
- Agent tools are bound to the active project slug.
- Deploy requires explicit UI confirmation (`DEPLOY`).

---

## Local development

```bash
pnpm install
pnpm dev:public-dev        # IDE → http://localhost:3004
pnpm dev:public            # verify deployed copy → http://localhost:8080
```

Set `apps/public-dev/.env.local` (see `.env.example`). Default deploy is **local filesystem**:

```env
DEPLOY_LIVE_HOST=local
# DEPLOY_LIVE_DOCROOT defaults to apps/public-site/
```

Preview: `http://localhost:3004/preview/home-services/index.html` (same process as the IDE).

---

## Deploy

**Local (default):** `DEPLOY_LIVE_HOST=local` copies `sites/<slug>/` → `apps/public-site/`.

**Production:** set remote host, SSH user, and `DEPLOY_LIVE_DOCROOT=/home/…/public_html`.

Use **Settings** in the IDE for per-project overrides (saved in `sites/<slug>/.project.json`).

```bash
curl -s -X POST localhost:3004/api/projects/home-services/deploy \
  -H 'content-type: application/json' -d '{"mode":"test"}'
```

---

## Hostinger

```bash
HOSTINGER_APP=public-dev npm run hostinger:public-dev
# or: pnpm hostinger:public-dev
```

Build copies `sites/` into the standalone output. On the server, preview stays at
`https://dev.yourdomain.com/preview/<slug>/`.

---

## Daily workflow

1. Edit in the IDE (`sites/<slug>/`).
2. Preview in the **Preview** tab (or `/preview/<slug>/`).
3. **Deploy** → dry-run → confirm → files land in `apps/public-site/` (local) or `public_html` (prod).
4. Verify with `pnpm dev:public` or open www.

Backups and audit log: `apps/public-dev/.deploy/`.
