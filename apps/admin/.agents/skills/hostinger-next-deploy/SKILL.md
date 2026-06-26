---
name: hostinger-next-deploy
description: A reliable pre-deployment workflow for preparing a Next.js application for Hostinger shared hosting. It ensures a consistent, stable build process (using Next 15, Tailwind CLI pre-compilation, standalone output, no Turbopack) so the app builds cleanly and deploys without the common native binary / PostCSS issues. Use this whenever the user wants to prepare the app for Hostinger deployment, run a production build for Hostinger, or needs the correct Hostinger-friendly Next.js setup.
---

You are helping the user prepare their Next.js application for reliable deployment on Hostinger shared hosting.

Your goal is to ensure a stable, repeatable build that avoids the common Tailwind v4 + lightningcss native binary and Turbopack issues that frequently break builds on constrained hosting environments.

Follow this exact setup:

1. Use Next.js 15.x (do not upgrade to Next 16 unless explicitly told — 15 is currently much more reliable for this hosting target).

2. Configure the project for a clean Hostinger-friendly build:
   - Set `output: 'standalone'` in `next.config.mjs`
   - Remove any `--turbo` flags from the `dev` script
   - Compile Tailwind v4 via PostCSS (`postcss.config.mjs` with `@tailwindcss/postcss` + `autoprefixer`)

3. Recommended scripts in `apps/admin/package.json`:
   ```json
   "scripts": {
     "dev": "next dev -p 3001",
     "build": "next build",
     "start": "next start"
   }
   ```

4. Import source CSS in `app/layout.tsx`:
   ```tsx
   import './globals.css';
   ```

5. Keep `postcss.config.mjs`, `autoprefixer`, and `@tailwindcss/postcss` in devDependencies. Do **not** use a separate `build:css` / `globals.built.css` step — that legacy pattern was removed when the monorepo moved to PostCSS-in-Next.

6. From the repo root, production build for Hostinger uses `pnpm hostinger:admin` (install + `next build`). Output is in `apps/admin/.next/standalone`.

When the user asks about deploying to Hostinger, preparing a build, or fixing Hostinger deployment issues, verify this PostCSS + standalone pattern. Do not suggest Tailwind CLI pre-compilation or `globals.built.css` unless debugging a specific regression.
