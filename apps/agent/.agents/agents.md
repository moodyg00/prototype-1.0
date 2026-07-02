---
name: prototype-agent
description: Agent IDE — pane/studio workspace for workflows, media, memory, browser automation
argument-hint: Describe a new feature, pane, API route, or studio layout change
tools: ['read', 'write', 'search', 'execute/runInTerminal']
---

You are working on **`@prototype/agent`** — the Next.js agent IDE (port **3002**). It is the canvas-based workspace where users open studios, panes, and toolbar tools.

**Monorepo:** pnpm workspace at repo root. Dev: `pnpm dev:agent`. Typecheck: `pnpm --filter @prototype/agent typecheck`.

<rules>
- **Pane migration is in progress.** New UI work goes into feature catalogs + pane components, not monolithic `*Panel.tsx` views.
- **Runner is not toolbar-eligible** — it lives inside the workflow studio (`workflow.runner` pane). Do not add `runner` to `TOOLBAR_TOOL_IDS`.
- **Never commit secrets**, `.env*`, or runtime artifacts (`apps/agent/.data/`, `apps/agent/public/uploads/`).
- **Migrate persisted tool ids** when renaming/removing tools (`apps/agent/lib/tool-id-migration.ts`).
- Multitask/delegation is optional; follow the architecture below.
</rules>

## Mental model

| Concept | What it is | Where it lives |
|---------|------------|----------------|
| **Tool / Feature** | Top-level capability (`ToolId`) | `apps/agent/lib/tools.ts` |
| **Pane** | Smallest UI unit; one view inside a split tree | `*FeatureCatalog.tsx` → `panes/*.tsx` |
| **Studio** | Multi-pane preset opened as one floating canvas window | `StudioPreset` in feature catalog; rendered by `StudioWindow` |
| **Panel slot** | Docked chrome column stacking panes vertically | `PanelSlotView` + `PaneLayoutHost` |
| **Pane window** | Single detached pane on the infinite canvas | `PaneWindow` |
| **Toolbar tool** | Icon on a tooltip bar; click behavior depends on migration state | `ToolPicker`, `TooltipBar` |
| **Legacy tool** | Unmigrated feature still using `ToolViewHost` → `PanelContent` | `wrapLegacyFeature()` in `pane-catalog.tsx` |

**Open behavior** (toolbar click), from `WorkspaceProvider.handleBarToolClick`:

1. Feature has a **studio preset** → `openStudio(featureId, studioId)` (e.g. workflow, runs, browser, memory, photography).
2. Feature is **migrated but has no studio** → `openPaneOnCanvas` (e.g. runner: `studios: []`).
3. Feature is **not migrated** → docks to tooltip bar via `DockedPanel` + `ToolViewHost`.

**Scope:** Each pane gets a `scopeId` via `PaneScopeContext`. Studio-scoped features (workflow) key state by studio instance id. Use `usePaneScope()` in panes when placement matters.

## Decision tree

```
New capability?
├─ User-facing surface in the IDE?
│  ├─ Yes → Add ToolId to tools.ts (if new top-level tool)
│  │       → Create *FeatureCatalog.tsx (panes + optional studios)
│  │       → Register in pane-catalog.tsx MIGRATED_CATALOGS
│  │       → Create panes under components/panels/<domain>/panes/
│  │       → Shared state across panes? → *Provider.tsx + mount in ViewportShell.tsx
│  │       → Studio-scoped state? → scope registry + optional *ScopeBridge.tsx
│  │       → Toolbar entry? → automatic if in TOOLBAR_TOOL_IDS (exclude runner)
│  └─ No  → API route + lib service only
├─ Cross-feature navigation? → agent-navigation.ts (dispatchAgentNavigate / openStudio / openPane)
├─ Shared types/models for IDE + agent? → packages/ide-tools/
└─ DB-backed? → Prisma via apps/agent/lib/prisma + @prototype/db
```

| Need | Add |
|------|-----|
| Multi-pane default layout | `StudioPreset` in feature catalog |
| One-off detachable view, no preset | Pane only, `studios: []` |
| State shared across panes of same feature | `*Provider.tsx` at ViewportShell level |
| Per-studio-instance state | Scope registry (see WorkflowProvider) |
| HTTP from UI | `apps/agent/app/api/<domain>/.../route.ts` |
| File-backed dev prefs/queues | `apps/agent/lib/**` store → `apps/agent/.data/*.json` |
| Model catalogs / shared constants | `packages/ide-tools/src/` |

## Step-by-step: UI layer (new feature)

### 1. Register the tool (if new top-level feature)

`apps/agent/lib/tools.ts`:

- Add to `ToolId` union and `TOOLS` array (`label`, `icon`, `defaultSize`, optional `surfaceHints`).
- Toolbar list is `TOOLBAR_TOOL_IDS` (= all except `runner`).

If renaming/removing: update `apps/agent/lib/tool-id-migration.ts`.

### 2. Create feature catalog

`apps/agent/components/panels/<domain>/<domain>FeatureCatalog.tsx`:

```ts
// Pane ids: '<featureId>.<name>' e.g. 'runs.list'
// Studio ids: '<featureId>.<preset>' e.g. 'runs.console'
export const runsFeatureCatalog: FeatureCatalog = {
  featureId: 'runs',
  label: 'Runs',
  panes: [listPane, detailPane],
  studios: [consoleStudio], // or [] for canvas-only single pane
};
```

Register in `apps/agent/lib/pane-catalog.tsx` → `MIGRATED_CATALOGS`.

### 3. Create pane components

`apps/agent/components/panels/<domain>/panes/*.tsx`:

- Signature: `({ context }: { context: PaneRenderContext })`.
- Use domain hook (`useRuns`, `useWorkflow`, etc.) for data/actions.
- `context.scopeId` when state must be studio-scoped.

### 4. Provider (if shared state needed)

Pattern: `apps/agent/components/panels/<domain>/<Domain>Provider.tsx`

- `createContext` + `use<Domain>()` hook throwing if missing provider.
- Fetch from `/api/...`, listen to `AGENT_NAVIGATE_EVENT` for deep links.
- Mount in `apps/agent/components/workspace/ViewportShell.tsx` (wrap inside existing provider tree).

**Not needed** for stateless panes or when each pane fetches independently.

### 5. Studio preset layout

Define `StudioPreset.root` as a `StudioSplitTemplate` split tree referencing `paneId`s. Sizes are weights; `instantiateStudioTemplate()` in `panel-layout.ts` converts to live instances.

Users can also add individual panes via `FeatureMenu` in panel slots.

### 6. Toolbar / navigation

- Toolbar: included automatically when tool is in `TOOLBAR_TOOL_IDS` and workspace layout lists it (`workspace-layout.ts` seeds).
- Deep links: `apps/agent/lib/agent-navigation.ts` — extend `AgentNavigateDetail`, handle in provider or `WorkspaceProvider` (`AGENT_NAVIGATE_EVENT` listener).
- Helpers: `openStudio(toolId, studioId)`, `openPane(toolId, paneId)`.

### 7. Scope keys (studio-scoped features)

Workflow pattern:

- `WorkflowProvider` maintains `scopeStates: Record<scopeId, WorkflowScopeState>`.
- `useWorkflow()` reads `usePaneScope().scopeId`.
- `WorkflowScopeBridge` syncs `session.scopeWorkflowIds` ↔ registry on studio close.
- Events: `WORKFLOW_SCOPE_PERSIST_EVENT`, `WORKFLOW_DISPOSE_SCOPE_EVENT` in `agent-navigation.ts`.
- Persist map: `apps/agent/lib/workflow-scope-persist.ts` + `LayoutSession.scopeWorkflowIds` in `layout-store.ts`.

Copy this pattern for other features that allow multiple studio instances with independent document state.

## Step-by-step: background layer

### API routes

Location: `apps/agent/app/api/<domain>/route.ts` or `[id]/route.ts`.

Conventions observed:

- Validate JSON body; return `NextResponse.json({ error }, { status: 400 })` on bad input.
- Workflow CRUD: Prisma (`apps/agent/lib/prisma`).
- Photography/video generation: `apps/agent/lib/integrations/*-llm.ts` + media services.
- Memory: delegates to `@prototype/memory` / Chroma routes under `api/memory/`.
- Browser: Playwright CDP under `api/browser/`.

### Lib services

| Layer | Path |
|-------|------|
| Integrations (LLM, providers) | `apps/agent/lib/integrations/` |
| Domain logic | `apps/agent/lib/<domain>/` |
| Media persistence | `apps/agent/lib/media/` |
| Workflow engine | `apps/agent/lib/workflow/` |

### File persistence (dev/local)

JSON stores under `apps/agent/.data/` (gitignored):

- `image-model-prefs.json` — `lib/media/image-model-prefs-store.ts`
- `video-model-prefs.json` — `lib/media/video-model-prefs-store.ts`
- `video-render-queue.json` — `lib/video/render-queue.ts`
- Photography jobs — `lib/media/photography-jobs.ts`

**Do not commit** `.data/` contents or `public/uploads/`.

### Shared packages

`packages/ide-tools/` — browser-safe model catalogs, prompts, types. Import `@prototype/ide-tools/image-models`, etc. Server-only FS code: `@prototype/ide-tools/server`.

Also used: `@prototype/db`, `@prototype/memory`, `@prototype/media`, `@prototype/auth`.

Wire API routes to read/write prefs using ide-tools types.

## File path reference

| Purpose | Path |
|---------|------|
| Tool registry | `apps/agent/lib/tools.ts` |
| Pane types | `apps/agent/lib/pane-types.ts` |
| Catalog registry | `apps/agent/lib/pane-catalog.tsx` |
| Split-tree helpers | `apps/agent/lib/panel-layout.ts` |
| Workspace layout seeds | `apps/agent/lib/workspace-layout.ts` |
| Session persistence (localStorage) | `apps/agent/lib/layout-store.ts` |
| Canvas groups | `apps/agent/lib/canvas-groups.ts` |
| Chrome metrics / snap | `apps/agent/lib/chrome-layout.ts` |
| Navigation / events | `apps/agent/lib/agent-navigation.ts` |
| Tool id migration | `apps/agent/lib/tool-id-migration.ts` |
| Pane shell | `apps/agent/components/pane/PaneHost.tsx` |
| Split renderer | `apps/agent/components/pane/PaneLayoutHost.tsx` |
| Scope context | `apps/agent/components/pane/PaneScopeContext.tsx` |
| Studio window | `apps/agent/components/pane/StudioWindow.tsx` |
| Pane window | `apps/agent/components/pane/PaneWindow.tsx` |
| Add pane/studio menu | `apps/agent/components/pane/FeatureMenu.tsx` |
| Workspace state | `apps/agent/components/workspace/WorkspaceProvider.tsx` |
| Viewport + providers | `apps/agent/components/workspace/ViewportShell.tsx` |
| Canvas | `apps/agent/components/workspace/CanvasViewport.tsx` |
| Panel slots | `apps/agent/components/workspace/PanelSlotView.tsx` |
| Toolbar picker | `apps/agent/components/workspace/ToolPicker.tsx` |
| Legacy bridge | `apps/agent/components/tools/ToolViewHost.tsx` |
| Legacy panel router | `apps/agent/components/PanelContent.tsx` |
| Global chrome CSS | `apps/agent/app/globals.css` |
| Hover-reveal overlays | `apps/agent/components/ui/HoverRevealZone.tsx` |
| API routes | `apps/agent/app/api/**` |
| Shared IDE types | `packages/ide-tools/src/` |

## Conventions

### Naming

- Feature catalog: `<domain>FeatureCatalog.tsx` exporting `<domain>FeatureCatalog`
- Pane ids: `<toolId>.<kebab-name>` (e.g. `memory.recall`)
- Studio ids: `<toolId>.<preset>` (e.g. `workflow.builder`)
- Provider: `<Domain>Provider.tsx`, hook `use<Domain>()`
- Pane files: `<Name>Pane.tsx` or `<Name>View.tsx` in `panes/`

### Pane spans

`third` | `half` | `full` — weights 1:2:3 for stack-below insertion (`panel-layout.ts`).

### CSS / chrome

- Panel/studio shells: `.panel-shell`, `.panel-titlebar`, `.panel-drag-handle`
- Canvas selection: `.canvas-window-selected` (green border, `rgba(57, 255, 20, …)` in `globals.css`)
- Resize handles: violet hover (`PaneLayoutHost` / `react-resizable-panels`)
- Floating controls: wrap in `HoverRevealZone` (see `CanvasControls`, `WorkflowCanvas`)
- Background: `#09090b` viewport, `#111113` panel shell

### Provider mounting order

`ViewportShell.tsx` nests: MediaLibrary → Memory → Runs → Browser → Workflow (+ WorkflowScopeBridge) → Photography → VideoProduction.

Add new providers adjacent to related features.

## PR-ready checklist

- [ ] `pnpm --filter @prototype/agent typecheck` passes
- [ ] `pnpm --filter @prototype/agent lint` if touching many files
- [ ] New `ToolId` added to `tool-id-migration.ts` if replacing old ids
- [ ] Feature registered in `MIGRATED_CATALOGS`
- [ ] Provider mounted in `ViewportShell` if added
- [ ] No secrets, `.data/`, or `public/uploads/` in commit
- [ ] Manual smoke: toolbar click, studio open, pane detach/reattach, deep link if added

## Cross-agent continuity

### Reading git status

Large refactors often touch:

- `apps/agent/components/pane/` — new pane host system
- `apps/agent/components/panels/*/panes/` — per-feature migration
- `apps/agent/lib/pane-*.ts`, `panel-layout.ts` — catalog/types
- Deleted: `PanelContainerView.tsx` (replaced by `PanelSlotView.tsx`)

If `*Panel.tsx` still exists alongside `panes/`, migration is partial — prefer extending panes + catalog.

### Pane migration pattern

1. Split monolithic panel into `PaneDefinition`s + pane components.
2. Add `*FeatureCatalog.tsx` with `studios` preset matching old layout.
3. Register in `MIGRATED_CATALOGS`.
4. Move shared state to `*Provider.tsx`.
5. Legacy path remains via `wrapLegacyFeature()` until registered.

### Migrated features (current)

`workflow`, `runs`, `browser`, `memory`, `photography`, `video`, `media-library`, `runner` — all in `MIGRATED_CATALOGS`.

### In-progress signals

- Untracked `components/pane/`, `components/panels/*/panes/`
- Modified `WorkspaceProvider.tsx`, `layout-store.ts`
- `WorkflowScopeBridge.tsx`, `workflow-scope-persist.ts` for scope work

### Agent transcripts

Past chats: `~/.cursor/projects/.../agent-transcripts/*.jsonl` (outside repo).

## Examples

### Workflow (studio + scope registry)

- Catalog: `workflowFeatureCatalog` — 4 panes, `workflow.builder` studio (palette | canvas+runner | inspector).
- Provider: `WorkflowProvider` — per-`scopeId` graph state, Prisma via `/api/workflow`.
- Runner embedded as `workflow.runner` pane, not standalone toolbar tool.
- Bridge: `WorkflowScopeBridge` persists `scopeId → workflowId`.

### Runs (studio + simple provider)

- Catalog: list + detail panes, `runs.console` horizontal split.
- Provider: `RunsProvider` — filters, `/api/runs`, `consumePendingRunId()` deep link.

### Browser (studio + CDP provider)

- Catalog: `browser.task` + `browser.login`, `browser.console` studio.
- Provider: `BrowserProvider` — task runner + login capture, `/api/browser/*`.

### Memory (multi-pane studio)

- Catalog: 6 tab panes, `memory.console` nested split.
- Provider: `MemoryProvider` — agent scope, tab state, `/api/memory/*`.
- Deep link: `memoryTab` in `AgentNavigateDetail`.

### Photography (studio + ide-tools integration)

- Catalog: model picker, quick gen, preview, queue — `photography.studio` preset.
- Provider: `PhotographyProvider` — `/api/agents/[id]/image-models`, `/api/photography/generate`.
- Shared types: `@prototype/ide-tools/image-models`.

### Runner (migrated, no studio)

- `runnerFeatureCatalog`: single pane, `studios: []`.
- Opens as canvas pane window; stripped from toolbar (`TOOLBAR_STRIPPED_IDS`).
