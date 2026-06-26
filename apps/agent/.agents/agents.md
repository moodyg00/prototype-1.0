---
name: prototype-agent
description: Agent app — AI workspaces, browser automation, workflows, LangGraph
argument-hint: Describe a workspace, tool, operator, or agent behavior to build or improve
tools: ['read', 'write', 'search', 'vscode/memory', 'execute/runInTerminal', 'execute/getTerminalOutput', 'vscode/askQuestions', 'agent']
agents: ['Explore']
---

You are working on **`@prototype/agent`** — the agent control plane in the `prototype-1.0` monorepo. Operators, workflows, and data panels surface through a workspace-based UI. Browser automation uses Playwright; AI reasoning uses XAI (Grok) and LangChain/LangGraph where configured.

**Monorepo:** pnpm workspace. Shared: `@prototype/db`, `@prototype/auth`. Run with `pnpm dev:agent` (port **3002**).

**Stack:** Next.js 15 · TypeScript · Tailwind v4 · Prisma 7 · Playwright · Node 22 · pnpm 11.9.0

<rules>
- **Consult `XAI.md` first** for XAI API constraints before building reasoners or tools.
- **Agent behavior in `*.agent.md` files** under `skills/` — not inline in app code.
- **Credentials server-side only** — `lib/secure-store.ts`, env vars, never in UI or prompts.
- **Auth is wired.** `middleware.ts` protects all routes except `/auth/login`, `/api/auth/*`, `/api/workflow/health` when `AUTH_REQUIRED=true`. Same `@prototype/auth` session as admin (`proto_session` cookie). **Not** Supabase Auth.
- **Prefer composition** — reusable operators, workflows, panels in `lib/`.
- **Be concise.**
</rules>

<workflow>
## 1. Discovery
Explore existing workspaces, operators, reasoners, and `XAI.md` applicability.

## 2. Design
- **UI** → workspace panels in `components/panels/`, canvas in `components/WorkspaceCanvas.tsx`
- **External I/O** → `lib/operators/`
- **AI calls** → `lib/reasoners/` + `skills/*.agent.md`
- **Workflows** → `lib/workflow/`, `app/api/workflow/`
- **Data** → `@prototype/db` (schema in `packages/db/`)

## 3. Implementation
- Operators = external I/O; reasoners = AI; components = UI
- Validate API inputs; credentials never leave server
- `pnpm --filter @prototype/agent exec tsc --noEmit` or root typecheck

## 4. Verification
- `pnpm dev:agent` → http://localhost:3002
- `AUTH_REQUIRED=false` in `apps/agent/.env.local` for open local dev
</workflow>

<capabilities>
- Workspace panels (Team, Workflow, Browser, LangSmith, C-Suite)
- Playwright browser operator with live screenshots
- LangGraph compile at `POST /api/csuite/compile`
- LangSmith tracing via `LANGCHAIN_*` env vars
- Shared Postgres via `@prototype/db`
- Session auth shared with admin in production
</capabilities>

<project_structure>
```
apps/agent/
  app/
    api/              auth, workflow, visual-browser, csuite, pure-browser
    auth/             Login page
  components/         Workspace UI, panels, EventStream, LiveBrowserView
  lib/
    operators/        BrowserOperator, types
    reasoners/        XAI-backed reasoning
    workflow/         LangGraph compiler, node catalog
    auth/             Middleware wrapper (@prototype/auth)
    workspaces.ts     Workspace definitions
    panels.ts         Panel registry
  skills/             Agent prompt files (*.agent.md, *.md)
  middleware.ts       Auth gate
  XAI.md              XAI API reference
packages/db/          Shared Prisma
packages/auth/        Shared sessions
```
</project_structure>

---

### Environment and commands

| Variable / command | Notes |
|--------------------|-------|
| Port | **3002** |
| `DATABASE_URL` | Same Postgres as admin |
| `AUTH_*` | Match admin in production (`AUTH_COOKIE_DOMAIN=.yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3002` locally |
| `XAI_API_KEY` | Grok models for reasoners |
| `LANGCHAIN_TRACING_V2`, `LANGCHAIN_API_KEY`, `LANGCHAIN_PROJECT` | LangSmith (optional) |
| `CSUITE_MODEL` | Default model for C-Suite compile (e.g. `grok-4.3`) |
| `pnpm dev:agent` | Dev server |
| Hostinger build | Root script `hostinger:agent` |

Deploy: `docs/DEPLOYMENT.md`. Agent registry and XAI patterns: `.agents/xaiapi.md`, `.agents/create_agent.md`.

### Agent registry

| Name | Location | Model | Role |
|------|----------|-------|------|
| BrowserActionReasoner | `lib/reasoners/BrowserActionReasoner.ts` | grok | Screenshot → next browser action |
| LoginSpecialist | `lib/reasoners/LoginSpecialist.ts` | grok | Human-style login flows |
