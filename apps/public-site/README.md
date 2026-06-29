# apps/public-site

**Live public website docroot** — plain static HTML/CSS/JS served at `www` in production.

Locally this folder simulates `public_html` on the Hostinger server:

| Local | Production |
|-------|------------|
| `apps/public-site/` | `/home/…/public_html` |
| Edit in public-dev IDE (`sites/<slug>/`) | Same IDE on `dev.yourdomain.com` |
| Deploy from IDE (host `local`) | Deploy via SSH/SFTP (remote host) |

## Workflow

1. Edit `home-services` (or other project) in **public-dev** at `http://localhost:3004`
2. Preview inside the IDE (`/preview/<slug>/`)
3. **Deploy** → copies project files into this folder (local) or uploads to `public_html` (production)
4. Verify with `pnpm dev:public` (serves this folder on :8080)

Legacy `pnpm promote:public` still copies `sites/home-services` → here without the IDE.

Do **not** edit this folder directly during normal development — use the IDE and deploy.
