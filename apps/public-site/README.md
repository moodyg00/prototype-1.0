# Public site

Static marketing site — plain HTML/CSS/JS in `dev/` and `live/`.

| Path | Purpose | Local preview |
|------|---------|---------------|
| `dev/` | Edit + preview | `pnpm dev:public` → :8080 |
| `live/` | Promoted production copy | `pnpm dev:public:live` → :8081 |

## Pages

- `index.html` — Home (SMS-first quote funnel)
- `pressure-washing.html`, `gutter-cleaning.html`, `tv-mounting.html`, `boat-detailing.html`
- `about.html`, `area.html`, `reviews.html`, `blog.html`
- `contact.html` — Contact form (posts to admin API)

## Contact form

The static site has no server-side code. Form submissions go to the admin app:

```
POST {adminApiBase}/api/public/contact
```

Local default: `http://localhost:3001` (see `dev/js/public/config.js`).

Creates a `Contact` + `Lead` in shared Prisma schema (`packages/db`) and attaches uploaded photos to the lead.

Admin env for production CORS:

```
PUBLIC_SITE_ORIGINS=https://yourdomain.com,https://dev.yourdomain.com
```

## Local preview

```bash
pnpm dev:public
```

Run `pnpm dev:admin` as well if testing the contact form locally.

## Regenerate from legacy (one-time)

If you still have PHP sources elsewhere, `scripts/migrate-public-site-static.mjs` was used for the initial port. Legacy PHP has been removed from this app.

Agent context: `.agents/agents.md`