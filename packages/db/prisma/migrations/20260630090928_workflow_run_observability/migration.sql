-- AlterTable
ALTER TABLE "booking_links" ALTER COLUMN "fields_to_collect" SET DEFAULT '[]'::jsonb;

-- AlterTable
ALTER TABLE "estimate_templates" ALTER COLUMN "line_items" SET DEFAULT '[]'::jsonb;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "meta" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "content" SET DEFAULT '{"blocks":[]}'::jsonb,
ALTER COLUMN "loop" SET DEFAULT '{"messages":[]}'::jsonb,
ALTER COLUMN "requires" SET DEFAULT '{}'::jsonb;

-- CreateTable
CREATE TABLE "WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "workflowName" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "input" TEXT NOT NULL DEFAULT '',
    "output" TEXT NOT NULL DEFAULT '',
    "errorText" TEXT,
    "threadId" TEXT,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "nodeCount" INTEGER NOT NULL DEFAULT 0,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "events" JSONB NOT NULL,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_idx" ON "WorkflowRun"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowRun_createdAt_idx" ON "WorkflowRun"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
