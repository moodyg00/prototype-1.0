# Architecture

## Overview

**proto-2** is a single deployable Next.js 15 App Router application — a business operations suite where humans and AI agents share one Postgres database. `/` redirects to `/admin`. There is no separate admin-agent-GUI repo in this codebase; agent runtime, memory, and task infrastructure live here under `src/agents/` and `src/core/`.

**Stack:** Next.js 15 · React 19 · TypeScript · Tailwind CSS v4 · Prisma 7 · PostgreSQL 16+ · npm · Node 22 (`.nvmrc`).

## Repository Layout

```
app/                    — App Router pages and API routes
  admin/                — Admin UI (accounting, billing, banking, calendar, CRM, design library)
    design/             — Design library browser (/admin/design)
  api/                  — Server endpoints (admin CRUD, webhooks, health, agent demo, public booking)
  book/[token]/         — Public booking pages (no admin shell)
components/             — Shared UI
  ui/                   — COSS primitives (dialog, field, table, menu, etc.)
  design/explorations/  — Design library source variants (installed via add-component skill)
  admin/                — Billing document editors, form shells, shared admin widgets
src/
  components/admin/     — Domain workspaces (ledger, journal, scheduling, mail, reports)
  design/manifest.ts    — Design library slug registry
  lib/                  — Business logic (see Domain Modules below)
  agents/               — Agent runtime bootstrap and demo entry points
  core/                 — Agent memory and task store
generated/              — Committed Prisma client output
prisma/                 — Schema, migrations, seed
.agents/                — Agent definitions, skills, docs
```

**Layering:** Pages/components handle UI only. Business logic lives in `src/lib/`. API routes in `app/api/` validate input, call services, and return JSON. Prisma is accessed only from server-side code (`src/lib/`, API routes, server components).

## Admin UI

- **Entry:** `/admin` — sidebar layout with domain sections (accounting, billing, banking, scheduling, catalog, CRM, settings).
- **Design library:** `/admin/design` — browse production-ready UI patterns. Slugs and categories in `src/design/manifest.ts`; source variants in `components/design/explorations/<category>/`. Install into product code with the `add-component` skill (`.agents/skills/add-component/SKILL.md`).
- **UI foundation:** COSS primitives in `components/ui/` only. No shadcn/Radix-only wrappers. Tailwind v4 pre-compiles to `app/globals.built.css` via `npm run build:css`.
- **Generic CRUD:** Some sections use shared record pages (`app/admin/[section]/`) backed by `src/lib/admin-record-operations.ts` and `src/lib/admin-record-form-config.ts`. Domain-heavy screens (ledger, estimates, bank transactions) have dedicated pages and components.

## Data Layer

- **Schema:** `prisma/schema.prisma` — ~100 models ported from the original Laravel schema (CRM, operations, finance, marketing, integrations). DB columns stay snake_case; TS fields are camelCase.
- **Client:** Generated to `generated/` (committed). Instantiated in `src/lib/prisma.ts` with a PrismaPg adapter and an audit extension that writes to `ChangeLog`.
- **Migrations:** `prisma/migrations/` — apply with `npx prisma migrate deploy`. Rerun `npm run prisma:generate` after schema changes.
- **Document numbering:** Shared Postgres sequences allocate atomic numbers for journal entries (`JE`), invoices (`INV`), estimates (`EST`), and work orders (`WO`). See `src/lib/accounting/numbering.ts`. Preview endpoints (`*/next-number`) peek without advancing the sequence.

## Domain Modules (`src/lib/`)

| Module | Path | Responsibility |
|--------|------|----------------|
| Accounting | `accounting/` | Journal entries, ledger queries, money helpers, financial reports |
| Banking | `banking/` | Mercury sync, bank rules, transaction categorization, JE generation from bank txns |
| Billing | `billing/` | Estimate and invoice services, line items, document totals |
| Operations | `operations/` | Work orders, services, products, estimate acceptance → work order |
| Scheduling | `scheduling/` | Calendar events, booking links, public booking pages, availability |
| Integrations | `integrations/` | Load API integrations and system settings from DB |
| Mercury | `mercury/` | Mercury API client, webhook processing, mappers |
| Email | `email/` | Provider config and manual send |
| Validation | `validation/` | Zod schemas for all API inputs |
| Admin helpers | `admin-record-*.ts`, `change-log.ts` | Generic CRUD, audit formatting |

Supabase client stubs exist in `src/lib/supabase/` for future auth; **auth is not wired yet** — no root `middleware.ts`, admin APIs are open during development.

## API Routes

All routes validate request bodies with Zod schemas from `src/lib/validation/`. Shared error handling in `src/lib/accounting/api-helpers.ts` maps service errors and `ZodError` to HTTP responses.

| Prefix | Purpose |
|--------|---------|
| `app/api/admin/` | Admin CRUD and domain actions (estimates, invoices, journal entries, bank sync, ledger, reports, scheduling, integrations) |
| `app/api/admin/[section]/` | Generic list/create for configured admin sections |
| `app/api/book/[token]/` | Public booking submit (unauthenticated) |
| `app/api/webhooks/mercury/` | Mercury bank webhook |
| `app/api/cron/bank-sync/` | Scheduled bank sync trigger |
| `app/api/health/db/` | Database connectivity check |
| `app/api/agent-demo/` | Agent runtime demo |
| `app/api/tasks/actions/` | Task action hooks |

**Pattern:** Route handler → parse/validate with Zod → call `src/lib/` service → return `NextResponse.json`. Domain services throw typed errors (`*ServiceError`, `AcceptEstimateError`) that routes map to status codes.

## Integrations & Secrets

API keys, webhook secrets, and integration config live in the **database**, not `.env`:

- **Admin → API integrations** — `Integration` model; loaded via `src/lib/integrations/load-integration.ts`
- **Admin → Settings → Email Provider** — `Setting` model (module `email`)
- **System settings** — `src/lib/integrations/system-settings.ts`
- **Bootstrap:** `npm run integrations:bootstrap` imports legacy `.env.local` values once

Only `DATABASE_URL` and `NEXT_PUBLIC_*` stay in environment variables.

## Key Workflows

### Estimates → Work Orders
1. Draft estimate via `src/lib/billing/estimate-service.ts` (line items from services/products).
2. Accept via `POST /api/admin/estimates/[id]/accept` → `acceptEstimateAndCreateWorkOrder()` allocates a `WO` number, creates the work order, copies service lines, snapshots materials.
3. Work order lifecycle in `src/lib/operations/work-order-service.ts`.

### Billing
- Estimates and invoices share document patterns: editors in `components/admin/billing/`, validation in `src/lib/validation/billing-document.ts`, totals via `compute-document-totals.ts`.
- Invoice service mirrors estimate service in `src/lib/billing/invoice-service.ts`.

### Accounting & Ledger
- Manual journal entries: create → post → reverse (`src/lib/accounting/journal-entries.ts`).
- Global ledger workspace queries posted entries with date/account filters.
- Per-account ledger at chart-of-accounts detail pages.
- Bank-generated JEs link back to `BankTransaction` records; ignored transactions are excluded from ledger aggregates.

### Banking (Mercury)
1. Sync accounts/cards/transactions via `POST /api/admin/bank/sync` or cron/webhook.
2. Default and custom bank rules categorize transactions (`src/lib/banking/apply-bank-rules.ts`).
3. Generate journal entries from categorized transactions (`journal-from-transaction.ts`).
4. Manual categorize or ignore individual transactions in admin UI.

### Accounting Reports
- `POST /api/admin/accounting-reports/generate` — trial balance, P&L, balance sheet, general ledger.
- Report builders in `src/lib/accounting/reports/`; output as HTML preview, CSV, or Markdown.

### Scheduling
- Booking links with token-based public pages at `/book/[token]`.
- Calendar events, availability rules, and booking creation via `src/lib/scheduling/`.
- Booking links can optionally tie to a work order.

## Agent Runtime

Lightweight agent infrastructure (not a full agentic OS yet):

- **Bootstrap:** `src/agents/bootstrap.ts` — registers memory tools and demo tools.
- **Runtime:** `src/agents/runtime.ts` — tool registration and agent execution.
- **Memory:** `src/core/memory/` — service, types, and tools for agent memory (demo-level).
- **Tasks:** `src/core/tasks/` — task store and types.
- **Demo API:** `POST /api/agent-demo` — optional OpenAI integration via DB-stored credentials.

## Deployment

Single Next.js standalone output (`npm run build`). Initial target: Hostinger VPS. PostgreSQL runs as a system service (not bundled). See `.agents/skills/hostinger-next-deploy/SKILL.md` for production build notes.

## Naming Map (UI → Code)

| UI label | Model / route |
|----------|---------------|
| Catalog | `Product` / `/api/admin/products` |
| Offerings | `Service` / `/api/admin/offerings` |
| API integrations | `Integration` |
| Credentials | `Credential` |
| Log | `ChangeLog` |
