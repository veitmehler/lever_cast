-- Wave 4: spec-level automation tracking + post slot keys

ALTER TABLE "posts" ADD COLUMN "slotKey" TEXT;

CREATE TABLE "social_automation_spec_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "postsCreated" INTEGER NOT NULL DEFAULT 0,
    "assetsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_automation_spec_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "social_automation_spec_results_runId_slotKey_key" ON "social_automation_spec_results"("runId", "slotKey");
CREATE INDEX "social_automation_spec_results_runId_status_idx" ON "social_automation_spec_results"("runId", "status");

ALTER TABLE "social_automation_spec_results" ADD CONSTRAINT "social_automation_spec_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "social_automation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
