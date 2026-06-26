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
   - Pre-compile CSS using the Tailwind CLI before Next runs its build

3. Recommended scripts in package.json:
   ```json
   "scripts": {
     "dev": "npm run build:css && next dev",
     "build:css": "npx @tailwindcss/cli -i ./app/globals.css -o ./app/globals.built.css --minify",
     "build": "npm run build:css && next build",
     "start": "next start"
   }
   ```

4. Update `app/layout.tsx` (or equivalent) to import the pre-built CSS file:
   ```tsx
   import './globals.built.css';
   ```

5. Make sure `autoprefixer` is present in devDependencies if Next complains about missing PostCSS plugins during build.

6. After running `npm run build`, the production output will be in `.next/standalone`. This folder (plus the `public` folder) is what should be deployed to Hostinger.

When the user asks about deploying to Hostinger, preparing a build, or fixing Hostinger deployment issues, always propose or verify this exact pattern instead of suggesting Turbopack, Next 16, or running the PostCSS plugin directly during the webpack build step.

If the user wants to switch strategies later (e.g., full monorepo or separate services via MCP), you can discuss alternatives, but default to this reliable Hostinger shared hosting pattern unless told otherwise.
