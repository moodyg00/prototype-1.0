# @prototype/public-dev

A lightweight, static-site IDE (intended for `dev.mysite.com`) for editing multiple
plain **HTML/CSS/JS** projects and deploying them to a live web docroot over SSH/SFTP.

- **No build step, no framework output.** Every project is plain static files.
- **Monaco editor** in the center, **scoped agent chat** on the right, file tree on the left.
- **Live preview** served directly from each project folder.
- **Safe one-click deploy**: dry-run → optional backup → explicit confirmation → SFTP upload → audit log → rollback.

Projects live in the repo-level [`/sites/<slug>`](../../sites) folder, one folder per site.

---

## Architecture

```
apps/public-dev/
  app/
    page.tsx                         # server: loads projects, renders <Ide/>
    preview/[slug]/[[...path]]/route  # serves static project files (+ <base> injection)
    api/
      projects/route.ts               # GET list / POST create project
      projects/[slug]/files/route.ts  # GET tree / POST create file|dir
      projects/[slug]/file/route.ts   # GET read / PUT write / DELETE
      projects/[slug]/agent/route.ts  # POST agent chat (scoped tools)
      projects/[slug]/deploy/route.ts # POST plan | execute
      projects/[slug]/deploy/audit    # GET deploy history + backups
      projects/[slug]/deploy/rollback # POST rollback to a backup
      health/deploy/route.ts          # GET SSH/SFTP connectivity probe
  src/
    lib/projects.ts   # path-scoped file CRUD (security boundary)
    lib/deploy.ts     # ssh2-sftp deployer, backups, audit, rollback
    lib/agent/tools.ts# scoped agent toolset + system prompt
    components/       # Ide, FileTree, AgentChat, DeployModal
  middleware.ts       # reuses @prototype/auth (preview is public, IDE is protected)
```

### Security model
- Every file path from the UI or the agent passes through `resolveInProject()`, which
  forbids `..` traversal and re-roots absolute paths inside the project. Code **cannot**
  read or write outside `/sites/<slug>`.
- The agent's tools are bound to the active `slug` at construction time, so it is
  structurally unable to touch another project or the deploy host filesystem.
- Deploy **always** requires an explicit `confirm: "DEPLOY"` from the UI; the agent's
  `request_deploy` tool only *opens the dialog* — it never deploys.

---

## Local development

```bash
# from repo root
pnpm install
pnpm dev:public-dev        # → http://localhost:3004
```

Set local env in `apps/public-dev/.env.local` (see `.env.example`). With
`AUTH_REQUIRED=false` you skip login locally.

---

## SSH / deploy setup

Deploys use **key-based SSH** to the same Hostinger account that serves the live site.

1. **Create a key** (if you don't have one) and add the **public** key to the Hostinger
   account (hPanel → Advanced → SSH Access, or `~/.ssh/authorized_keys` on the server):

   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/mysite_deploy -C "public-dev deploy"
   # copy the PUBLIC key (mysite_deploy.pub) to the server's authorized_keys
   ssh-copy-id -i ~/.ssh/mysite_deploy.pub -p <port> <user>@<host>
   ```

2. **Configure the "live" target** in `apps/public-dev/.env.local`:

   ```env
   DEPLOY_LIVE_HOST=123.45.67.89
   DEPLOY_LIVE_PORT=22
   DEPLOY_LIVE_USER=u123456789
   DEPLOY_LIVE_SSH_KEY=~/.ssh/mysite_deploy        # PRIVATE key path
   DEPLOY_LIVE_SSH_PASSPHRASE=                      # only if the key is encrypted
   DEPLOY_LIVE_DOCROOT=/home/u123456789/domains/mysite.com/public_html
   ```

3. **Verify connectivity** before deploying:

   ```bash
   curl -s localhost:3004/api/health/deploy | jq
   # { "ok": true, "docroot": "...", "docrootExists": true }
   ```

### Project settings (per-project deploy config)
Click **Settings** in the top bar to edit a project's name/description and its **deploy
overrides** (host, port, SSH user, private key path, remote docroot). Any field left blank
inherits from the target env (`DEPLOY_LIVE_*`); filled fields override env **for that project
only** and are saved to `sites/<slug>/.project.json`. The key **passphrase** is never stored
per project — it always comes from `DEPLOY_LIVE_SSH_PASSPHRASE`. Use **Test connection** there
to verify access before deploying.

Per-project target override: set `"target"` in `sites/<slug>/.project.json` (only `"live"`
is shipped today; add more targets in `getDeployConfig()`).

### `.deploy-ignore`
Optional, per project (`sites/<slug>/.deploy-ignore`). gitignore-style lines; supports `*`
wildcards and directory prefixes. `.project.json`, `.deploy-ignore`, `.git`, `node_modules`,
and `.DS_Store` are always excluded.

---

## Daily workflow

1. Pick or create a project in the top-bar switcher.
2. Edit files in Monaco (`⌘/Ctrl+S` to save). The live preview refreshes on save.
3. Optionally ask the agent (right panel) to make scoped edits.
4. When the site is **tested and stable**, click **Deploy**:
   - Review the **dry-run** (files, sizes, remote docroot).
   - Keep **"create a backup"** checked (recommended).
   - Type **`DEPLOY`** to confirm and upload.
5. Need to undo? Open **Deploy → History & rollback** and roll back to a backup.

Backups and the audit log are written under `apps/public-dev/.deploy/` (gitignored).
