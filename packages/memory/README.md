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
# Start Chroma (Docker — preferred when daemon is running)
pnpm docker:up   # postgres + chroma

# Or local Chroma server (no Docker)
pnpm dev:chroma  # persists to data/chroma on port 8000

# Agent app needs CHROMA_URL in apps/agent/.env.local, then restart dev:agent

# Apply DB catalog (from repo root)
pnpm --filter @prototype/db exec prisma migrate deploy

# Seed memory workflows (agent must be running)
cd apps/agent && BASE_URL=http://localhost:3002 pnpm seed:memory
```

If migrate fails on `20260630090928_workflow_run_observability` (table already exists):

```bash
pnpm --filter @prototype/db exec prisma migrate resolve --applied 20260630090928_workflow_run_observability
pnpm --filter @prototype/db exec prisma migrate deploy
```

## Webhook & schedule hooks (Agent app)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/memory/hooks/ingest` | Webhook ingest (`mode: ingest` or `turn`) |
| `POST /api/memory/cron/ingest` | Cron batch ingest (`batches: [{ text, agentId }]`) |

Set `MEMORY_WEBHOOK_SECRET` / `MEMORY_CRON_SECRET` and pass `X-Memory-Webhook-Secret` or `Authorization: Bearer …`.

Seed **Memory Agent (RAG)** and **Memory Webhook ingest** via `scripts/seed-memory-workflows.ts`.

## Tests

```bash
pnpm --filter @prototype/memory test
```