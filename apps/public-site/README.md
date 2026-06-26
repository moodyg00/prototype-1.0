# Public site

Static marketing site — plain HTML/CSS/JS (no PHP pipeline long-term).

## Folders

| Path | Purpose | Dev URL | Production host |
|------|---------|---------|-----------------|
| `dev/` | Agents edit + preview | `pnpm dev:public` → :8080 | `dev.yourdomain.com` |
| `live/` | Promoted production copy | `pnpm dev:public:live` → :8081 | `yourdomain.com` |
| `legacy/` *(root PHP files)* | Old PHP site — retire over time | — | — |

## Local workflow

```bash
pnpm dev:public          # preview dev/ on :8080
pnpm promote:public      # copy dev/ → live/
pnpm dev:public:live     # preview live/ on :8081
git add apps/public-site && git commit && git push   # optional history
```

## Hostinger (Business plan)

Static only — **not** a Node app.

1. `dev.yourdomain.com` → point subdomain docroot to uploaded `dev/` files
2. `yourdomain.com` → docroot for `live/` files
3. Promote = re-upload/rsync `live/` or run promote locally then push via git/FTP

Legacy PHP at repo root stays until pages are rebuilt in `dev/`.
