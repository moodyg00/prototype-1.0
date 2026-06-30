CREATE TABLE IF NOT EXISTS "memory_chunks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chroma_id" VARCHAR(120) NOT NULL,
    "scope_kind" VARCHAR(20) NOT NULL,
    "scope_id" VARCHAR(120),
    "partition" VARCHAR(80) NOT NULL DEFAULT 'default',
    "source_kind" VARCHAR(40) NOT NULL,
    "content_excerpt" VARCHAR(500) NOT NULL,
    "content_hash" VARCHAR(64),
    "metadata" JSONB,
    "workflow_run_id" VARCHAR(64),
    "status" VARCHAR(40) NOT NULL DEFAULT 'indexed',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memory_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "memory_chunks_scope_kind_scope_id_created_at_idx" ON "memory_chunks"("scope_kind", "scope_id", "created_at");
CREATE INDEX IF NOT EXISTS "memory_chunks_workflow_run_id_idx" ON "memory_chunks"("workflow_run_id");

CREATE TABLE IF NOT EXISTS "memory_agent_bindings" (
    "agent_id" VARCHAR(120) NOT NULL,
    "read_scopes" JSONB NOT NULL,
    "write_scopes" JSONB NOT NULL,
    "default_partition" VARCHAR(80) NOT NULL DEFAULT 'default',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "memory_agent_bindings_pkey" PRIMARY KEY ("agent_id")
);