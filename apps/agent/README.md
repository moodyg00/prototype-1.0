# Agent (`@prototype/agent`)

Agent workspace UI — browser automation, workflows, and AI operators.

| | |
|---|---|
| Dev | `pnpm dev:agent` → http://localhost:3002 |
| Package | `@prototype/agent` |
| Auth | `@prototype/auth` — shared session with admin in production |
| Database | `@prototype/db` |

## Workspaces

- **Team** — executive room panels
- **Workflow** — visual workflow builder (LangGraph compile)
- **Browser** — unified Playwright/CDP browser (visual, headless, login modes)
- **Runs** — native workflow run traces (status, latency, tokens, timeline)
- **C-Suite** — LangGraph compile endpoint

## Environment

```bash
XAI_API_KEY=              # Grok models
CSUITE_MODEL=grok-4.3
```

Workflow run traces are recorded natively in the `WorkflowRun` table — no external
tracing service (e.g. LangSmith) is required.

## Commands

```bash
pnpm dev:agent
pnpm --filter @prototype/agent exec tsc --noEmit
```

Agent context: `.agents/agents.md` · XAI reference: `XAI.md` · Deploy: `docs/DEPLOYMENT.md`
