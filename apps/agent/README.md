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
- **Browser / Visual browser** — Playwright with live screenshots
- **LangSmith** — trace review panel
- **C-Suite** — LangGraph compile endpoint

## Environment

```bash
XAI_API_KEY=              # Grok models
LANGCHAIN_TRACING_V2=true # optional LangSmith
LANGCHAIN_API_KEY=
LANGCHAIN_PROJECT=agentic-enterprise
CSUITE_MODEL=grok-4.3
```

## Commands

```bash
pnpm dev:agent
pnpm --filter @prototype/agent exec tsc --noEmit
```

Agent context: `.agents/agents.md` · XAI reference: `XAI.md` · Deploy: `docs/DEPLOYMENT.md`
