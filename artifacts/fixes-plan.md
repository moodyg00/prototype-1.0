# prototype-1.0 fixes plan

**Branch:** `dev` (from `main`)  
**Owner:** grok-build  
**Principle:** robust over quick. Sequential phases, one commit per phase, validate before handoff.

## Keep (do not regress)

- pnpm workspace + Turbo pipeline
- Shared packages direction (`@prototype/db`, `@prototype/auth`, `@prototype/media`, `@prototype/accounting`)
- `proto_session` auth cookie across admin/agent
- Worker as separate deployable (cron trigger)
- Prisma audit extension
- Agent foundation (workflow compiler, node-catalog, operators/reasoners)
- coss/ui + shadcn component intent in admin

---

## Phase 1: Bloat cleanup (design explorations)

| | |
|---|---|
| **Problem** | 154 exploration TSX files (14 categories × 10 variants). Design studio ships all variants in dev bundle paths; manifest is huge. |
| **Root** | Proto-2 design library port kept every variation for comparison; no archive pass. |
| **Fix** | Keep 1–2 variants per category (FAVORITES first, then lowest-number fallbacks). Move rest to `components/design/explorations/archive/`. Trim `src/design/manifest.ts` and regenerate `*Explorations.tsx` imports. |
| **Validate** | `pnpm --filter @prototype/admin build` succeeds; design routes load; no broken imports; smaller exploration tree. |
| **Handover** | Commit `phase-1: prune design explorations` on `dev`. |

**Production keepers (from `FAVORITES`):** header×2, sidebar×1, cards×2, tables×1, empty-states×2, loading×1, form-layouts×1, page-header×1. Categories without favorites default to Variation01 + Variation02.

---

## Phase 2: Package extraction (banking)

| | |
|---|---|
| **Problem** | Banking logic lives only in `apps/admin/src/lib/banking/` (12 files) while `@prototype/accounting` exists with journal helpers only. |
| **Root** | Early monorepo extraction stopped at journal entry; Mercury sync never moved. |
| **Fix** | Move `banking/*` → `packages/accounting/src/banking/`. Re-export from `packages/accounting/src/index.ts`. Update all admin imports. Logic unchanged. |
| **Validate** | `pnpm typecheck`; banking/cron tests if present; no duplicate modules. |
| **Handover** | Commit `phase-2: extract banking to @prototype/accounting`. |

**Files:** `apply-bank-rules`, `bank-rule-types`, `bank-category-config`, `default-bank-rules`, `ignore-transaction`, `ignored-journal-entry-ids`, `journal-from-transaction`, `list-cards`, `list-transactions`, `manual-bank-category`, `process-mercury-webhook`, `sync-mercury`.

---

## Phase 3: Worker hop removal

| | |
|---|---|
| **Problem** | Worker POST `/jobs/bank-sync` proxies to admin `POST /api/cron/bank-sync` — extra HTTP hop + dual secret handling. |
| **Root** | Worker introduced as thin cron entry before shared job package existed. |
| **Fix** | Move bank-sync orchestration into `@prototype/accounting` (or `packages/jobs`). Worker calls package function directly. Admin `/api/cron/bank-sync` becomes thin wrapper or deprecated alias. |
| **Validate** | `curl` worker job <  prior latency; bank sync audit rows still written; Hostinger cron path documented. |
| **Handover** | Commit `phase-3: worker direct bank-sync`. |

---

## Phase 4: Agent expansion

| | |
|---|---|
| **Problem** | Agent has workflow compiler + browser operators but no tool registry, persisted memory, or test harness. |
| **Root** | Foundation built for UI demos; runtime not productized. |
| **Fix** | Add `lib/agents/tools/` (Tool interface + registry), extend memory with Prisma store, workflow test harness with assertions, 5–10 core tools (complete browser nav/extract/login specialist stubs). Expand bootstrap/runtime for registry + memory. |
| **Validate** | Harness runs sample workflow; tools registered; no agent scope creep beyond core set. |
| **Handover** | Commit `phase-4: agent tools registry and harness`. |

**Existing foundation:** `lib/workflow/compiler.ts`, `node-catalog.ts`, `operators/BrowserOperator.ts`, `reasoners/LoginSpecialist.ts`, LangSmith panel.

---

## Phase 5: Admin + root polish

| | |
|---|---|
| **Problem** | Admin pages inconsistent loading/error handling; root `scripts/` has overlapping hostinger helpers; no Docker dev story. |
| **Root** | Rapid Hostinger iteration; thin pages not standardized. |
| **Fix** | Admin: `loading.tsx` / `error.tsx` patterns on thin routes; consolidate shared UI from `components/ui/`. Root: dedupe hostinger scripts, add `docker/` compose for local stack, tune Turbo cache for parallel typecheck/build. |
| **Validate** | Full typecheck + build; tree cleaner; no deploy regression. |
| **Handover** | Commit `phase-5: admin polish and root scripts`. |

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Design archive breaks add-component skill paths | Update `manifest.ts` paths only for active variants; archive path documented |
| Banking extraction import cycles | Move types first; run typecheck after each file group |
| Worker cron break on Hostinger | Re-test `curl` job after phase 3; keep admin cron route as fallback one release |
| Agent scope creep | Bound phase 4 to registry + harness + 5–10 tools only |
| Per-app Hostinger deploys | Accept short-term; Docker is long-term local dev |

---

## Execution log

| Phase | Status | Commit |
|-------|--------|--------|
| 1 | done | `phase-1: prune design explorations` |
| 2 | pending | — |
| 3 | pending | — |
| 4 | pending | — |
| 5 | pending | — |