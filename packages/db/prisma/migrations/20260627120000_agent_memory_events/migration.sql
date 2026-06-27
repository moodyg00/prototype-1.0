CREATE TABLE "agent_memory_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agent_id" VARCHAR(120) NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 2,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_memory_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_memory_events_agent_id_created_at_idx" ON "agent_memory_events"("agent_id", "created_at");