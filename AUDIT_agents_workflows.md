# Agents / Workflows Audit — `apps/agent` + `apps/public-dev`

Date: 2026-07-01
Scope: read-only audit. No application code was modified. This file is the only artifact written.

---

## 0. TL;DR

`apps/agent` has a genuinely good architectural skeleton: one canonical `WorkflowDefinition` type, one node catalog (`node-catalog.ts`), a real LangGraph compiler + runtime. But **that skeleton is undermined by at least four parallel, divergent execution/codegen paths inside the same app**, a **third, unrelated "org chart" data model duplicated verbatim across two panels**, several **stub UI surfaces** ("Coming soon" placeholders, hardcoded org charts, a Flowise-URL tab that does nothing), and **broken/dead generated code** (the `artifacts/workflows/*.graph.ts` files don't compile — they reference nodes that were never added to the builder, and use `ToolNode` without importing it).

`apps/public-dev` is mid-migration: it used to run its own agent loop on the Vercel AI SDK (`ai`/`tool()`), and per the current (uncommitted) diff it now **delegates over HTTP to `apps/agent`'s LangGraph "IDE Agent Visual" workflow** — which is the right direction per your stated preference. But the old AI-SDK tool implementation (`src/lib/agent/tools.ts::buildProjectTools`) is now **dead code with zero call sites**, and the delegation is a hardcoded `localhost:3002` HTTP hop between two Next.js apps with no auth, no retry, and a silent fallback to "editor still works, just no agent" — worth deciding whether that's the permanent shape or a bridge.

---

## 1. Inventory

### 1.1 `apps/agent` — agents, workflows, execution engines

| # | Name | Defined at | Model | Represented in visual editor? |
|---|------|-----------|-------|-------------------------------|
| 1 | **LangGraph workflow runtime** ("Workflow" panel, `kind: 'langgraph'`) | `apps/agent/lib/workflow/runtime.ts` (`buildGraph`), backed by `node-catalog.ts` (28 node types) + `compiler.ts` (`compileToLangGraphIR`) | Real `@langchain/langgraph` `StateGraph`, real node executors (LLM, HTTP, browser, memory, video, IDE) | **Yes** — `components/panels/WorkflowPanel.tsx` + `components/workflow/*` render every catalog entry via `NodePalette`/`WorkflowCanvas`/`NodeInspector`. This is the one legitimate, fully-wired visual editor. |
| 2 | **"Standard" workflow runtime** (`kind: 'standard'`) | `apps/agent/lib/workflow/standard-runtime.ts` (`runStandardWorkflow`) | **Not LangGraph** — a hand-rolled linear walk over `orderedNodeIds()` (follows exactly one outgoing edge per node; explicitly rejects condition/interrupt nodes) | Same editor UI as #1 (same `nodes`/`edges` shape), but a **second execution engine** interprets it differently at runtime. See §2.1. |
| 3 | **Ad-hoc "Agent Runtime"** (`agentRuntime.run(agentId, prompt)`) | `apps/agent/lib/agents/runtime.ts`, invoked by `app/api/agents/[agentId]/run/route.ts` | Neither LangGraph nor the workflow engine — a single `invokeChatLlm()` call per turn. `toolRegistry.list()` is fetched but **never actually bound to the LLM call** (no tool-calling loop; tools are dead weight here). | **No.** This "Agents" registry/runtime has no workflow-graph representation at all; `lib/tools.ts` even marks the `agents` tool card as `status: 'pending'` (line 82), i.e. Grok/Composer built a backend for a feature whose own frontend entry says "not built yet." |
| 4 | **"C-Suite" org/workflow compiler** | `apps/agent/components/panels/CSuitePanel.tsx` (client draft state) + `apps/agent/app/api/csuite/compile/route.ts` | **Fourth, independent code generator.** Has its own `OrgNode`/`OrgEdge`/`WorkflowDraft` types (duplicated, not imported from `lib/workflow/types.ts`) and its own from-scratch LangGraph-script-string builder (`compileWorkflowToLangGraphScript`), unrelated to `lib/workflow/compiler.ts`'s `generateTypeScaffold`. | **No** — it's a JSON-textarea editor with a "Flowise" URL field (unused) and a script preview tab, not the `@xyflow/react` canvas used by #1. |
| 5 | **Static "Team" org chart** | `apps/agent/components/panels/TeamPanel.tsx` | N/A — hardcoded array of 9 people (`defaultTeam.nodes`), no backend, no persistence | **No.** Purely decorative; the only interactive element is a button that jumps to the Memory panel scoped to a fixed agent id string (`ceo`, `cfo`, ...) that doesn't correspond to any real seeded agent/workflow anywhere in the codebase. |
| 6 | **Browser agent** (`tool.browser` node + standalone panel) | `lib/operators/BrowserOperator.ts`, wired into LangGraph via `buildBrowserToolNode` in `runtime.ts:195-223` | Wrapped as a LangGraph tool node — genuinely well-integrated | Yes, as `tool.browser` in the catalog, plus its own dedicated `BrowserPanel` for standalone (non-workflow) use. |
| 7 | **Memory pipeline nodes** (`memory.shard`, `.tag`, `.embed`, `.chroma_upsert`, `.chroma_recall`, `.recall_context`) | `lib/workflow/memory-executors.ts`, seeded workflows in `artifacts/workflows/memory-*.graph.ts` and `scripts/seed-memory-workflows.ts` | LangGraph nodes | Yes, full catalog + seeded example graphs exist as both `.graph.ts` (dead, see §3) and live DB-seeded workflows (via the seed scripts, which insert directly into Postgres, not via the `.graph.ts` files). |
| 8 | **Video production pipeline** (`video.generate/.timeline_load/.timeline_append/.analyze/.sync/.render/.media_meta`) | `lib/workflow/video-executors.ts`, `lib/video/*` (ffmpeg pipeline, render queue), `components/panels/video-production/*` | LangGraph nodes + a large standalone "Video Production" studio panel that duplicates some of the same timeline/render concepts outside the graph (`VideoTimeline.tsx`, `timeline-render-service.ts`, `timeline-analyze-service.ts`) | Yes in the catalog; the standalone studio panel is a second, non-graph way to drive the same render/analyze services directly via `app/api/video-production/*` routes — i.e., **two entry points into the same underlying render pipeline**, one graph-based, one panel-based, that can drift out of sync. |
| 9 | **IDE Agent (ReAct agent + IDE tool node cluster)** | `lib/workflow/ide-agent-node.ts` (`buildLlmAgentNode`), `lib/workflow/ide-executors.ts`, `tool.ide.*` catalog entries (list/read/patch/write/create/delete/move/copy/revert/request_deploy) | Real LangGraph tool-calling agent node, bound at runtime to file tools scoped by `@prototype/ide-tools` | Yes — seeded as the "IDE Agent Visual" workflow (`artifacts/workflows/ide-agent-visual.*`), consumed live by `app/api/ide-agent/run/route.ts`, which is what `apps/public-dev` now calls. This is the one clean end-to-end cross-app integration. |

### 1.2 `apps/public-dev` — agent/tools

| # | Name | Defined at | Model | Status |
|---|------|-----------|-------|--------|
| 1 | **Legacy in-process IDE agent tools** | `src/lib/agent/tools.ts` (`buildProjectTools`) | Vercel AI SDK (`ai`'s `tool()` + `inputSchema`), NOT LangChain | **Dead code.** Grepping the whole app finds only the definition, no call site (see §2.2). Kept alive only via a re-export of `AGENT_SYSTEM_PROMPT` from `@prototype/ide-tools/prompt`. |
| 2 | **`/api/projects/[slug]/agent` route** | `app/api/projects/[slug]/agent/route.ts` | Thin proxy — forwards to `apps/agent`'s `/api/ide-agent/run` over HTTP | Active, currently-edited path (see git diff, `todos` field just added). This is the real agent entry point today. |
| 3 | **`/api/projects/[slug]/chats/[id]` route** | `app/api/projects/[slug]/chats/[id]/route.ts` | Chat/thread persistence (JSON files under `sites/<slug>/.agent/sessions/`) | Active; unrelated to the LangChain/AI-SDK question, but see §2.3 for a session-format concern. |
| 4 | **`AgentChat.tsx`** | `src/components/AgentChat.tsx` (748 lines, +296/-11 in the current diff) | UI only — renders `text`/`tools`/`thoughts`/`todos` from whichever backend answered | Active. Now has to support two very different response shapes (the old inline-tool-call shape and the new LangGraph "thoughts" trace shape) since the backend swap wasn't accompanied by a type cleanup — see §2.3. |

**Net inventory takeaway:** across both apps there are effectively **five distinct "agent execution" implementations** (LangGraph workflow engine, standard linear engine, ad-hoc `AgentRuntime`, C-Suite script generator, and the now-orphaned AI-SDK tool set in public-dev), one canonical node catalog that is *not* used by three of those five, and one real visual editor that only fully represents the first.

---

## 2. Divergence / inconsistency findings

### 2.1 Two execution engines for the same `WorkflowDefinition` shape

- `apps/agent/lib/workflow/runtime.ts:271-351` (`buildGraph`) compiles a `WorkflowDefinition` into a real `StateGraph`, supports conditionals, interrupts, tool-bound agents, subgraphs.
- `apps/agent/lib/workflow/standard-runtime.ts:35-114` (`runStandardWorkflow`/`orderedNodeIds`) walks the **same** `def.nodes`/`def.edges` shape but assumes a single linear chain (`orderedNodeIds` just follows `edges.find(e => e.source === current)` once per node) and explicitly rejects conditionals/interrupts (`validateStandardWorkflow`, lines 107-114).
- Consequence: a workflow's *runtime semantics depend on an opaque `kind` field* (`'standard'` vs `'langgraph'`) chosen at creation time (`WorkflowPanel.tsx:31` defaults new workflows to `kind: 'langgraph'`, but `app/api/workflow/route.ts:57` defaults `kind` to `'standard'` if the client doesn't send one — **the create-workflow API and the create-workflow UI disagree on the default kind**). A workflow authored with branching nodes that later gets its `kind` flipped (or created via the API directly, bypassing the UI default) will silently misbehave instead of erroring clearly.
- `standard-runtime.ts` also re-implements `llm.chat` and `tool.http` node execution (lines 76-100) that already exist, more completely, in `runtime.ts` (`buildLlmNode`, `buildHttpToolNode`, lines 116-165) — same logic, two copies, will drift.

### 2.2 Dead agent implementation in `public-dev` left behind after migration

- `apps/public-dev/src/lib/agent/tools.ts` defines a full Vercel-AI-SDK tool set (`list_files`, `read_file`, `write_file`, `create_path`, `delete_file`, `request_deploy`) — **zero call sites** anywhere in `apps/public-dev` (confirmed via repo-wide grep for `buildProjectTools`).
- The active path (`app/api/projects/[slug]/agent/route.ts:66-107`) now just proxies to `apps/agent`'s LangGraph IDE agent.
- Risk: the next engineer (or agent) who needs to touch "how the IDE agent's tools work" has a 50/50 chance of editing the dead file instead of the real one (`apps/agent/lib/workflow/ide-executors.ts` + the `tool.ide.*` catalog entries), since `tools.ts` is not marked deprecated, still exports the system prompt re-export, and looks fully wired.

### 2.3 Two different "tool event" / "agent turn" data shapes

- Public-dev's dead code (`tools.ts`) defines `ToolEvent = { tool: string; summary: string }` and `AgentToolState`.
- The live proxy route (`apps/public-dev/app/api/projects/[slug]/agent/route.ts`) and the live `apps/agent` adapter (`app/api/ide-agent/run/route.ts:55-56, 169-190`) independently redefine `ToolEvent`/`ThoughtStep` shapes that are structurally similar but not type-shared (no shared package for the "agent turn result" contract between the two apps — it's duck-typed JSON over HTTP). Any field rename on one side (e.g. `summary` → `detail`) breaks the other silently, only caught at runtime.
- `AgentChat.tsx` (public-dev) has grown by +296 lines to absorb `thoughts`, `todos`, `modelId`, `tokens` fields that mirror concepts already modeled server-side in `apps/agent` (e.g. `GraphState.tokens`, `ide.todos` in `runtime.ts:37-63`) — again, no shared type package, just parallel hand-written interfaces on each side of the HTTP boundary.

### 2.4 Duplicated "org chart" data model (three copies)

`TeamPanel.tsx` (agent), `CSuitePanel.tsx` (agent), and `app/api/csuite/compile/route.ts` (agent) each **independently define** `OrgNodeType`, `OrgNode`, and (in two of the three) `OrgEdge`, with near-identical hardcoded seed data (`ceo`/`cfo`/`cto`/`clo`/`coo`, `grok-4.3` model default) — see:
- `apps/agent/components/panels/TeamPanel.tsx:9-36`
- `apps/agent/components/panels/CSuitePanel.tsx:7-32,41-81`
- `apps/agent/app/api/csuite/compile/route.ts:3-28`

None of these three share a type import; three copies of the same conceptual model that will inevitably drift (e.g. `TeamPanel`'s `defaultTeam` has 9 nodes, `CSuitePanel`'s `defaultDraft` has 10, already out of sync).

### 2.5 Four LangGraph-script generators, none shared

1. `lib/workflow/compiler.ts::generateTypeScaffold` — from `WorkflowDefinition` (real catalog).
2. `app/api/csuite/compile/route.ts::compileWorkflowToLangGraphScript` — from `WorkflowDraft` (org-chart JSON).
3. The exported `.graph.ts` files under `artifacts/workflows/*` are the *output* of generator #1, checked into the repo as if they were source — see §3.1, they're stale/broken snapshots, not live code.
4. `scripts/seed-*.ts` (`seed-memory-workflows.ts`, `seed-video-workflow.ts`, `seed-visual-workflows.ts`, `seed-ide-agent-workflow.ts`) construct `WorkflowDefinition` objects **by hand in TypeScript** and insert them directly into Postgres via Prisma — a fifth, parallel way to produce a workflow, bypassing both the UI and the compiler entirely.

### 2.6 LangChain/LangGraph adoption is inconsistent where it shouldn't be

Per your stated preference (simple regular workflows are fine for trivial actions; anything non-trivial or "in doubt" should be LangGraph), these should arguably be LangGraph but currently are not:
- `lib/agents/runtime.ts` (`AgentRuntime.run`) — a single un-tooled LLM call standing in for what `lib/tools.ts:82` labels a whole "Agent registry and configuration" feature. No graph, no tool loop, no persistence beyond a memory-log side effect.
- `app/api/csuite/compile/route.ts` — hand-string-templates a LangGraph script instead of reusing `compileToLangGraphIR`/`generateTypeScaffold`. There's no reason for this to be a separate compiler; it's solving the exact same problem (org-of-agents → LangGraph) as the real compiler with a worse, string-templated implementation (e.g. `builder.addNode(..., async (state) => ({ ...state, log: [...] }))` — every node is a no-op stub, line 46).
- `standard-runtime.ts` — acceptable as a deliberately "dumb" path *if* it's kept honestly linear-only and clearly documented/enforced (it does at least reject conditionals), but given nearly every "standard" workflow in this catalog has an HTTP/LLM/tool node, in practice almost nothing should default to `kind: 'standard'` — yet the workflow-creation API defaults to it (§2.1).

---

## 3. Stub / dead UI findings

| Finding | Location | Detail |
|---|---|---|
| **Broken generated workflow exports** | `apps/agent/artifacts/workflows/ide-agent-visual.graph.ts:130-172` (and the other 8 `*.graph.ts` files in the same dir) | Uses `ToolNode` without importing it (only `StateGraph, START, END, Annotation, interrupt` are imported, line 1); calls `builder.addEdge('tool_ide_list_files', 'agent')` etc. for 10 tool ids that were **never added via `builder.addNode`** (only a single `'tools'` node was added, line 153) — this file would throw at both compile-time (missing import) and graph-build-time (unknown edge source) if anyone tried to run it. It's a stale, never-executed artifact of the export feature, not something exercised by CI or tests. |
| **"Coming soon" placeholder tools** | `apps/agent/components/panels/PlaceholderPanel.tsx:18`, wired for any `ToolId` with `status: 'pending'` in `lib/tools.ts:82,93-96` (`agents`, `documents`, `analytics`, `mobile`, `website`) | 5 of 15 top-level tool cards in the shell render literally nothing but an icon + "Coming soon." `agents` is especially notable — a real backend (`AgentRuntime`, `toolRegistry`, `bootstrapAgents`) already exists (§1.1 #3) but has no UI, while the UI explicitly says it doesn't exist yet. |
| **Non-functional "C-Suite" Flowise tab** | `apps/agent/components/panels/CSuitePanel.tsx:84-86` (`flowiseUrl` state, `tab === 'flowise'`) | A URL input defaulting to `http://localhost:3001` with no visible fetch/iframe/proxy wiring found in the file's remaining ~117 unread lines beyond what was inspected — worth a follow-up read, but at minimum it's disconnected from the rest of the compiled-workflow flow. |
| **Static "Team" panel** | `apps/agent/components/panels/TeamPanel.tsx` | Entirely hardcoded org data (§2.4); "Open memory" button is the only live affordance, and it points at agent ids (`ceo`, `vp-finance`, ...) that don't correspond to any seeded `Agent` record, workflow, or `toolRegistry` entry anywhere else in the codebase — clicking it opens a memory view scoped to an agent that has never produced any memory. |
| **Video Production dual entry points** | `components/panels/video-production/*` vs `video.*` LangGraph nodes (§1.1 #8) | The standalone studio panel calls `app/api/video-production/{analyze,render,timeline}` directly; the workflow nodes call the same underlying services (`lib/video/timeline-analyze-service.ts`, `timeline-render-service.ts`) through the graph. Not "stub," but a maintenance trap: a bug fix or behavior change made in one path (e.g. adding a new sync mode) must be manually mirrored in the other, and nothing enforces that. |
| **`AgentRuntime.run` returns a placeholder string when no LLM key** | `apps/agent/lib/agents/runtime.ts:45` | `output = "[registered ${n} tools; set XAI_API_KEY for LLM responses]"` — reasonable as a dev fallback, but note this whole runtime is otherwise unreachable from any built UI surface (the `agents` tool card is `pending`), so this code path is effectively unexercised. |
| **`public-dev` dead agent tools** | `apps/public-dev/src/lib/agent/tools.ts` (all 134 lines) | Fully implemented, well-written tool set with zero callers (§2.2) — not a "stub," but dead weight that will confuse future edits. |
| **Memory embed/upsert "stub" behavior** | `apps/agent/lib/workflow/memory-executors.ts` (embed/upsert nodes) + catalog descriptions `node-catalog.ts:487,501` ("stub embedder until configured", "mock store when CHROMA_URL unset") | Explicitly documented as a stub/mock fallback rather than hidden — good practice — but confirms the memory pipeline is not production-real until `CHROMA_URL`/an embedder are configured; worth flagging since "Agent Memory" is marked `status: 'built'` in `lib/tools.ts:81` despite this. |

---

## 4. Visual workflow editor gap analysis

**What's in the editor today:** everything in `node-catalog.ts` (28 node types across trigger/llm/tool/transform/logic/memory/video/output/langgraph categories) is rendered via `NodePalette`, placed via `WorkflowCanvas`, and configured via `NodeInspector`. This part is solid — the catalog is the actual source of truth for the palette, so new catalog entries automatically show up in the UI. `WorkflowPanel.tsx` supports create / load / save (PATCH) / run (via `RunnerPanel`) / export.

**What's missing or inconsistent:**
1. **The "Agents" concept (`AgentRuntime`, `toolRegistry`) has no graph representation at all** — it's a separate backend concept that never became a node type or a panel. If "Agents" is meant to be a first-class thing (the `lib/tools.ts` entry implies it should be), it needs either (a) to become a saved `llm.agent` workflow like IDE Agent, or (b) a real "Agents" tool view backed by the same `Workflow`/`WorkflowVersion` Prisma model, not a bespoke `AgentRuntime` class.
2. **The org-chart / C-Suite concept is not expressed in the workflow editor's node/edge model at all** — it's a separate JSON-textarea UI with its own script generator (§2.5). To unify, `OrgNode`/`OrgEdge` would need to become workflow nodes (e.g. an `agent.role` node type with `manages`/`delegates`/`approves` edge semantics), which the current `WorkflowEdge` type doesn't model (edges currently only carry `condition`, not a relation/semantic type).
3. **`kind: 'standard'` workflows use the same canvas/palette as `kind: 'langgraph'` ones but silently support a strict subset at runtime** (§2.1) — the editor doesn't visually distinguish this or warn when you drag a `logic.condition` node into a `standard` workflow (it will fail at run time via `validateStandardWorkflow`, not at edit time).
4. **Video Production and Photography have dedicated full-screen studio panels that don't route through the graph at all** by default — a user editing a video pipeline in the studio panel has no way to "promote" that session into a reusable/branchable workflow graph, and vice versa; the two surfaces don't share state.
5. **Edit + redeploy:** workflows *do* support edit-and-rerun today — `WorkflowPanel.saveWorkflow` PATCHes `/api/workflow/[id]`, versions appear to increment (`currentVersion`), and `RunnerPanel` can execute the current definition immediately after a save with no separate "deploy" step (there's no build/compile-to-artifact-then-deploy gate in the loop). That's actually good for an internal tool, but it also means the checked-in `artifacts/workflows/*.graph.ts` "exports" are **not** what's actually running — the DB definition is — so those files are misleading if anyone assumes they reflect production behavior (they're stale the moment the DB workflow is edited again).

---

## 5. Proposed common architecture

Goal: one canonical way to define + run + edit + redeploy an "agent," "workflow," or "automation" across both apps, with LangGraph as the default execution substrate.

### 5.1 Core model (shared package, e.g. `@prototype/workflow-core`)
Promote `apps/agent/lib/workflow/types.ts` (already the best-designed data model in the repo) into a shared workspace package. Both apps, and any future app, import the same `WorkflowDefinition`, `WorkflowNode`, `WorkflowEdge`, `NodeTypeDefinition` types. This alone would have prevented the `public-dev` tool-shape drift in §2.3.

### 5.2 One execution engine
- Deprecate `standard-runtime.ts` as a *separate engine*. Instead, make "standard" just mean "a `langgraph` workflow whose graph happens to be a straight line" — i.e., always compile through `buildGraph`/`compileToLangGraphIR`, and let `kind` become purely a UI hint ("simple mode" palette that hides advanced nodes) rather than a second runtime. This removes an entire class of "works differently depending on a flag" bugs and satisfies your "most things should be LangGraph" preference directly — simple workflows are still just LangGraph graphs with one path.
- Retire `lib/agents/runtime.ts` (`AgentRuntime`) as a bespoke runtime; reimplement the "Agents" tool as a thin wrapper that creates/loads an `llm.agent`-rooted `WorkflowDefinition` (same pattern as IDE Agent) so it's visible in the same catalog/editor/run/trace machinery instead of a fourth bespoke path.
- Retire `app/api/csuite/compile/route.ts`'s bespoke script generator. Model org roles as workflow nodes (see §5.3) and reuse `compileToLangGraphIR`/`generateTypeScaffold`.

### 5.3 Extend the node catalog to cover "org" and "automation" concepts
Add node categories/types for what `TeamPanel`/`CSuitePanel` currently hardcode: e.g. `org.role` (executive/vp/manager/worker) with a `reportsTo`/`delegatesTo` edge kind, so the "Team"/"C-Suite" views become **read views over real `WorkflowDefinition` graphs** rather than independent hardcoded data. This directly removes the triplicated `OrgNode`/`OrgEdge` types from §2.4.

### 5.4 Fix or remove the `.graph.ts` export artifacts
Either (a) make the exporter produce genuinely runnable code (fix the missing `ToolNode` import and the tool-node edge bug in `compiler.ts`'s `generateTypeScaffold`, and add a CI check that `tsc --noEmit`-validates every checked-in `artifacts/workflows/*.graph.ts`), or (b) stop checking these in at all and treat "export" as an on-demand download, not a repo artifact — given they already silently drift from the live DB-backed definition (§4 point 5), (b) is simpler and lower-risk.

### 5.5 Cross-app agent contract
Formalize the `apps/public-dev` → `apps/agent` HTTP hop (`AGENT_BASE_URL`, currently defaulting to hardcoded `http://localhost:3002`) as a real internal API contract: shared request/response types (from `@prototype/workflow-core` or a new `@prototype/agent-client`), a documented timeout/retry policy, and ideally an internal auth token instead of an open localhost call — right now any process on the box can POST to `/api/ide-agent/run`. Decide explicitly whether public-dev should ever run its own local agent again (delete `src/lib/agent/tools.ts` if not) or whether the AI-SDK path is being kept intentionally as an offline/no-agent-app fallback (if so, document that decision in the file itself, since nothing currently indicates intent either way).

### 5.6 Rough phasing (prep only — do not implement yet)
1. **Phase 0 (safe cleanup, no behavior change):** delete/quarantine dead code — `public-dev/src/lib/agent/tools.ts` (or explicitly document it as an intentional fallback and wire it back in behind a feature flag), fix or delete the broken `artifacts/workflows/*.graph.ts` files, reconcile the `kind` default mismatch between `WorkflowPanel.tsx` and `app/api/workflow/route.ts`.
2. **Phase 1 (shared types):** extract `lib/workflow/types.ts` into a workspace package; update both apps' agent-facing HTTP contracts to import from it instead of hand-rolled duck types.
3. **Phase 2 (engine consolidation):** collapse `standard-runtime.ts` into `runtime.ts` (treat "standard" as a UI-level simple mode, not a second interpreter); migrate `AgentRuntime`/`agents` tool onto the workflow engine.
4. **Phase 3 (org/C-Suite unification):** add `org.role`/relation node types to the catalog; rebuild `TeamPanel`/`CSuitePanel` as views over real `WorkflowDefinition`s instead of hardcoded JSON; delete `app/api/csuite/compile/route.ts`'s bespoke generator in favor of the shared compiler.
5. **Phase 4 (editor completeness):** add a visual/graph bridge for Video Production and Photography studio state so studio sessions can be promoted to/from real workflow graphs; add edit-time validation warnings for `kind`-mismatched node usage instead of run-time failures.
6. **Phase 5 (cross-app hardening):** internal auth + retry/timeout policy for the public-dev → agent HTTP bridge; decide and document the AI-SDK-fallback question from §5.5.

---

## Executive summary (top findings, for quick reference)

1. **Five parallel "agent execution" implementations exist across the two apps** (LangGraph engine, linear "standard" engine, ad-hoc `AgentRuntime`, C-Suite script generator, and public-dev's now-dead AI-SDK tool set) — only one (LangGraph via `runtime.ts`) is fully-featured and fully wired into the visual editor.
2. **The checked-in workflow export artifacts (`apps/agent/artifacts/workflows/*.graph.ts`) are broken** — missing `ToolNode` import, edges reference nodes never added to the graph builder. They would fail if anyone tried to actually run them; they are not exercised by the live runtime, which reads from Postgres instead.
3. **`public-dev`'s original in-process agent tool implementation (`src/lib/agent/tools.ts`) is dead code** with zero call sites — the app has already been migrated to delegate to `apps/agent`'s LangGraph IDE agent over HTTP, but the old code wasn't removed, creating a trap for future edits.
4. **The workflow-creation API and the workflow-creation UI disagree on the default `kind`** (`'standard'` in `app/api/workflow/route.ts` vs `'langgraph'` in `WorkflowPanel.tsx`), and `'standard'` workflows are executed by a completely separate, more limited linear interpreter — a bug in either can silently produce wrong behavior depending on how the workflow was created.
5. **The "Team"/org-chart concept is triplicated** (`TeamPanel.tsx`, `CSuitePanel.tsx`, `csuite/compile/route.ts`) with independent, already-out-of-sync hardcoded data and no shared type — none of it is backed by the real workflow/agent data model.
6. **5 of 15 top-level tool cards in `apps/agent`'s shell are literal "Coming soon" placeholders** (`agents`, `documents`, `analytics`, `mobile`, `website`), and notably the `agents` backend (`AgentRuntime`/`toolRegistry`) already exists in code with no UI — effort was spent building a backend for a feature the frontend explicitly marks as not-yet-built.
7. **The `apps/agent` "Agents" runtime doesn't actually call tools** — `toolRegistry.list()` is fetched and returned as metadata but never bound into the LLM call, so despite the name this is a single-shot chat completion, not an agent loop.
8. **Video Production has two independent entry points into the same render pipeline** (a standalone studio panel and LangGraph workflow nodes) that call the same underlying services but aren't guaranteed to stay behaviorally identical.
9. **Cross-app "agent contract" between `public-dev` and `apps/agent` is untyped, unauthenticated JSON-over-HTTP to a hardcoded `localhost:3002`** — works for local dev, but is a real gap before this pattern is treated as canonical.
10. **The good news:** the LangGraph node catalog + compiler + runtime + visual editor in `apps/agent` (`node-catalog.ts`, `compiler.ts`, `runtime.ts`, `WorkflowPanel`/`WorkflowCanvas`) is a legitimately solid, extensible foundation — the recommended path is to make *everything else* converge on it (§5), not to build a sixth new system.

**Recommended next steps / phasing:** Phase 0 safe cleanup (delete dead code, fix or drop the broken `.graph.ts` exports, fix the `kind` default mismatch) → Phase 1 shared workflow-core types package → Phase 2 collapse the standard/LangGraph engines and migrate `AgentRuntime` onto the workflow engine → Phase 3 unify the org/C-Suite concept into the real node catalog → Phase 4 close the remaining visual-editor gaps (video/photography studio bridge, edit-time kind validation) → Phase 5 harden the public-dev↔agent HTTP contract. This audit is prep only; no implementation was attempted per your instructions.
