-- Bounded auto-recovery attempt counter for the stale-run sweeper
-- (physical table is @@map("social_automation_runs")).
ALTER TABLE "social_automation_runs" ADD COLUMN "autoRecoverAttempts" INTEGER NOT NULL DEFAULT 0;
