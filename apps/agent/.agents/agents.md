---
name: admin-agent
description: Backend control plane for the proto-2 business operations suite
argument-hint: Describe a feature, tool, workspace, or agent behavior to build or improve
tools: ['read', 'write', 'search', 'vscode/memory', 'execute/runInTerminal', 'execute/getTerminalOutput', 'vscode/askQuestions', 'agent']
agents: ['Explore']
---

You are working on **admin-agent** — a backend control plane for a suite of AI-powered business operations. The application surfaces operators, workflows, and data panels through a workspace-based UI. All intelligence in the application runs through agents powered by the XAI API (Grok models).

The codebase is built on Next.js, TypeScript, Tailwind CSS, Prisma, and Playwright. Agent behaviors are defined in `agent.md` files injected as system prompts into XAI API calls. The UI is organized into workspaces — each workspace contains panels and tools backed by operators and agents.

<rules>
- **Consult XAI.md first.** Before building or editing any function, tool, operator, or agent, read `XAI.md` to verify API compatibility, check constraints, and look for native features that improve the implementation.
- **Agent behavior lives in agent.md files.** Never define agent system prompts inline in application code. Each agent has its own `agent.md` injected as the `system` message in the API call.
- **Credentials stay server-side.** No API keys, passwords, or secrets ever appear in the UI, prompts, or client-side code.
- **Prefer composition.** Build reusable operators, workflows, and panels instead of hard-coded one-off features.
- **Keep catalogs centralized.** Constants, workspace definitions, and shared types belong in dedicated files, not scattered across components.
- **Refactor early.** When the current shape starts blocking new tools or agents, restructure before adding more.
- **Be concise.** No unnecessary comments, over-explanation, or scaffolding that won't stay true.
</rules>

<workflow>
## 1. Discovery
Before writing code, use the Explore subagent to gather:
- Existing patterns in the codebase to reuse or extend
- Which workspace, operator, or agent the task touches
- Relevant XAI API features from `XAI.md` that apply to the task
- Any blockers or dependencies to resolve first

When the task spans multiple areas (UI + backend, multiple workspaces), launch parallel Explore subagents — one per area.

## 2. Design
Determine the right layer for the work:
- **UI change** → workspace panel or toolbar component
- **External system control** → operator in `lib/operators/`
- **AI reasoning or decision** → agent with `agent.md` + reasoner in `lib/reasoners/`
- **Data persistence** → Prisma schema + migration
- **API endpoint** → route in `app/api/`

Draft the approach before writing code. For multi-step changes, outline the sequence and dependencies.

## 3. Implementation
- Follow the patterns already in the codebase — check analogous files before starting
- Operators handle external system I/O; reasoners handle AI calls; components handle UI only
- API routes must validate all inputs; credentials never leave the server
- After editing, run type-check to confirm zero TypeScript errors

## 4. Verification
- Confirm the change works end-to-end in the browser
- For agent changes, verify the agent.md reads cleanly as a standalone system prompt
- For API changes, verify request/response against `XAI.md` constraints
</workflow>

<capabilities>
- Build and modify workspace panels, operators, reasoners, and API routes
- Design and register agents with `agent.md` files backed by XAI Grok models
- Query and migrate the Prisma database
- Control a real Playwright browser through the visual browser operator
- Coordinate multi-step workflows across workspaces
- Reference `XAI.md` and `.agents/xaiapi.md` for API-native implementations
- Use the Explore subagent for codebase research before making changes
</capabilities>

<project_structure>
```
app/               — Next.js pages and API routes
  api/             — Server-side endpoints (browser control, secure store)
components/        — Shared UI components (EventStream, LiveBrowserView)
lib/
  operators/       — External system drivers (BrowserOperator)
  reasoners/       — XAI API reasoning calls (BrowserActionReasoner, LoginSpecialist)
  prisma.ts        — Database client
  secure-store.ts  — Server-side credential storage
prisma/            — Schema and migrations
.agents/           — Agent definitions, skills, and guides
  agents.md        — This file: project context and agent registry
  xaiapi.md        — XAI API skill: usage patterns and mandatory consultation rule
  create_agent.md  — Template and guide for writing agent.md files
  create_skills.md — Guide for building tools and skills
XAI.md             — XAI API documentation (authoritative reference)
AGENTS.md          — High-level working rules for the project
README.md          — Project overview and panel/tool descriptions
```
</project_structure>

---

## Agent Registry

| Name | File | Model | Description |
|------|------|-------|-------------|
| BrowserActionReasoner | `lib/reasoners/BrowserActionReasoner.ts` | grok | Reasons over screenshots to select the next browser action |
| LoginSpecialist | `lib/reasoners/LoginSpecialist.ts` | grok | Handles login flows requiring human-style interaction |

_Register new agents here as they are added. Include the agent.md path, model, and a one-line description._