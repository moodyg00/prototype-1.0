---
name: proto-2
description: Business operations suite — lightweight admin, accounting, billing, banking, and scheduling
argument-hint: Describe a feature, admin screen, API route, or business logic change to build or improve
tools: ['read', 'write', 'search', 'vscode/memory', 'execute/runInTerminal', 'execute/getTerminalOutput', 'vscode/askQuestions', 'agent']
agents: ['Explore']
---

You are working on **proto-2** — a production-grade business operating system where humans and AI agents collaborate across one shared business stack. The app provides a lightweight admin for CRUD, accounting, billing, banking sync, scheduling, and business automation. `/` redirects to `/admin`.

The codebase is built on Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Prisma 7, and PostgreSQL. Business logic lives in `src/lib/`; admin UI in `app/admin/` and `src/components/admin/`. Agent demos use the AI SDK with optional OpenAI integration (`src/agents/`). Admin UI patterns come from the **design library** (`/admin/design`); COSS primitives in `components/ui/` are the low-level building blocks underneath. Package manager is **npm**; Node **22** (`.nvmrc`).

<rules>
- **Start from the design library for admin UI.** Browse `/admin/design` (pages in `app/admin/design/`) to pick a production-ready pattern. Slugs and categories live in `src/design/manifest.ts`; source variants in `components/design/explorations/<category>/`. Install a variant into product code with the `add-component` skill (`.agents/skills/add-component/SKILL.md`): `/add-component <slug> <target-path>`. Do not hand-roll screens when a library variant fits.
- **Use COSS primitives only as the shared foundation.** Import buttons, dialogs, fields, tables, etc. from `components/ui/` when composing or extending design-library patterns. Do not introduce shadcn/Radix-only wrappers or ad hoc one-off component systems. See `.agents/docs/coss-ui.md`; run `npm run verify:coss-ui` when changing `components/ui/` primitives.
- **Credentials stay server-side.** API keys, webhook secrets, and integration config live in the database (`Admin → API integrations`, settings modules). Run `npm run integrations:bootstrap` once to import legacy `.env.local` values. Only `DATABASE_URL` and `NEXT_PUBLIC_*` stay in env.
- **Prefer composition.** Reuse existing abstractions in `src/lib/`, `src/components/admin/`, and `components/admin/` before creating new ones.
- **Schema-driven development.** Business entities and relationships belong in `prisma/schema.prisma` with migrations; rerun `npm run prisma:generate` after schema changes (client output is committed under `generated/`).
- **Validate API inputs.** All routes in `app/api/` must validate request bodies with Zod schemas in `src/lib/validation/`.
- **Auth is not wired yet.** No root `middleware.ts`; admin APIs are open during development. Add Supabase middleware before production.
- **Be concise.** No unnecessary comments, over-explanation, or scaffolding that won't stay true.
</rules>

<workflow>
## 1. Discovery
Before writing code, use the Explore subagent to gather:
- Existing patterns in the codebase to reuse or extend
- Which admin section, lib module, or API route the task touches
- Relevant Prisma models and validation schemas
- Any blockers or dependencies to resolve first

When the task spans multiple areas (UI + backend, multiple domains), launch parallel Explore subagents — one per area.

## 2. Design
Determine the right layer for the work:
- **UI change** → page in `app/admin/` or component in `src/components/admin/` / `components/admin/`. For new screens or patterns, browse the design library at `/admin/design` (`app/admin/design/`), pick a slug from `src/design/manifest.ts`, preview variants under `components/design/explorations/<category>/`, then install with `/add-component <slug> <target-path>` (see `.agents/skills/add-component/SKILL.md`).
- **Business logic** → service module in `src/lib/` (billing, banking, accounting, operations, scheduling)
- **Data persistence** → Prisma schema + migration in `prisma/migrations/`
- **API endpoint** → route in `app/api/admin/` or `app/api/`
- **Agent behavior** → runtime tool or context in `src/agents/` + `src/core/`

Draft the approach before writing code. For multi-step changes, outline the sequence and dependencies.

## 3. Implementation
- Follow the patterns already in the codebase — check analogous files before starting
- Components handle UI only; `src/lib/` handles business logic; API routes orchestrate and validate
- Document numbers come from shared Postgres sequences (`JE`, `INV`, `EST`, `WO`) — see `src/lib/accounting/numbering.ts`
- Tailwind v4 is pre-compiled to `app/globals.built.css` via `npm run build:css`; restart dev or rerun if styles look stale
- After editing, run `npm run typecheck` to confirm zero TypeScript errors

## 4. Verification
- Confirm the change works end-to-end in the browser (`npm run dev` → http://localhost:3000)
- For DB changes, verify with `curl http://localhost:3000/api/health/db` → `{"ok":true,"database":"connected"}`
- For UI changes, confirm the installed or composed pattern in the browser; run `npm run verify:coss-ui` when editing `components/ui/` primitives
- For API changes, verify request/response against the Zod schema and existing route patterns
</workflow>

<capabilities>
- Build and modify admin pages, design-library components, COSS primitives, API routes, and `src/lib/` business logic
- Install design-library variants via the `add-component` skill (`src/design/manifest.ts`, `components/design/explorations/`)
- Query and migrate the Prisma database (`npm run prisma:migrate`, `npm run prisma:seed`)
- Work with accounting (journal entries, ledger, reports), billing (estimates, invoices), banking (Mercury sync), and scheduling (calendar, booking links)
- Configure integrations and email provider through admin settings (stored in DB)
- Extend the agent runtime with tools in `src/agents/` (OpenAI integration optional)
- Use the Explore subagent for codebase research before making changes
- Reference `.agents/docs/` for architecture, COSS UI, and product context
</capabilities>

<project_structure>
```
app/                    — Next.js App Router pages and API routes
  admin/                — Lightweight admin UI (accounting, billing, banking, calendar, design library, etc.)
    design/             — Design library browser (/admin/design)
  api/                  — Server-side endpoints (admin CRUD, webhooks, health, agent-demo)
components/             — Shared UI primitives and design library source
  ui/                   — COSS primitives (dialog, menu, field, table, etc.)
  design/explorations/  — Design library variants (10 per category; installed via add-component)
  admin/                — Billing document editors and shared admin form shells
src/
  components/admin/     — Domain-specific admin workspaces (ledger, journal, scheduling, mail)
  design/manifest.ts    — Design library slug registry (categories, favorites, file paths)
  lib/                  — Business logic (accounting, banking, billing, operations, validation)
  agents/               — Agent runtime bootstrap and demo entry points
  core/                 — Agent memory, tasks, and shared agent infrastructure
generated/              — Committed Prisma client output
prisma/                 — Schema, migrations, and seed data
.agents/                — Agent definitions, skills, and guides
  agents.md             — This file: project context and agent registry
  docs/                 — Architecture, COSS UI, product context, plan
  skills/               — Task-specific skills (add-component, deploy, debugging, etc.)
AGENTS.md               — Environment-specific notes for Cursor Cloud agents
README.md               — Project overview and env var setup
```
</project_structure>

---

### Environment and commands

| Service | Required | Notes |
|---------|----------|--------|
| Next.js dev server | Yes | `npm run dev` → http://localhost:3000 |
| PostgreSQL 16+ | Yes for DB-backed routes | Default: `postgresql://postgres:postgres@localhost:5432/proto2` |

**Standard commands:** `npm run dev` · `npm run typecheck` · `npm run verify:coss-ui` · `npm run build` · `npm run prisma:generate` · `npm run prisma:migrate` · `npm run prisma:seed` · `npm run integrations:bootstrap`

**First-time DB setup:** `npx prisma migrate deploy` → (if empty DB fails: `npx prisma db push` then migrate deploy) → optional `npm run prisma:seed`

**Lint:** `npm run lint` prompts for interactive ESLint setup; use `typecheck` and `verify:coss-ui` as reliable static checks.

### Naming map (UI → code)

| UI label | Model / route |
|----------|---------------|
| Catalog | `Product` / `/api/admin/products` |
| Offerings | `Service` / `/api/admin/offerings` |
| API integrations | `Integration` |
| Credentials | `Credential` |
| Log | `ChangeLog` |

### Document numbering

Shared Postgres sequences allocate numbers for journal entries (`JE`), invoices (`INV`), estimates (`EST`), and work orders (`WO`). See `src/lib/accounting/numbering.ts`.
