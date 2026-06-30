# @prototype/memory

Vector memory helpers for the Agent workspace: shard → tag → embed → Chroma (or mock store).

## Environment (Agent app)

| Variable | Default | Purpose |
|----------|---------|---------|
| `CHROMA_URL` | unset → mock | Chroma HTTP API |
| `CHROMA_COLLECTION` | `mhp_memory` | Collection name |
| `MEMORY_EMBED_PROVIDER` | `stub` | `stub` \| `xai` \| `openai` |
| `MEMORY_EMBED_MODEL` | `text-embedding-3-small` | Embedding model |
| `XAI_API_KEY` / `OPENAI_API_KEY` | — | Required for non-stub embedder |

**Note:** Stub embeddings use 384 dimensions; HTTP providers use 1536. Re-ingest after switching providers.

## Ops

```bash
# Apply DB catalog (from repo root)
pnpm --filter @prototype/db exec prisma migrate deploy

# Seed memory workflows (agent must be running)
cd apps/agent && BASE_URL=http://localhost:3002 npx tsx scripts/seed-memory-workflows.ts
```

If migrate fails on `20260630090928_workflow_run_observability` (table already exists):

```bash
pnpm --filter @prototype/db exec prisma migrate resolve --applied 20260630090928_workflow_run_observability
pnpm --filter @prototype/db exec prisma migrate deploy
```

## Tests

```bash
pnpm --filter @prototype/memory test
```