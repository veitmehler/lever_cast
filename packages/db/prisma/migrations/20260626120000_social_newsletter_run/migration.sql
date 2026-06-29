-- Newsletter-sourced social automation runs (weekly cadence).
ALTER TABLE "social_automation_runs" ADD COLUMN "newsletterId" TEXT;
ALTER TABLE "social_automation_runs"
  ADD CONSTRAINT "social_automation_runs_newsletterId_fkey"
  FOREIGN KEY ("newsletterId") REFERENCES "newsletters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "social_automation_runs_newsletterId_idx" ON "social_automation_runs"("newsletterId");
-- New runs default to 3 specs (weekly cadence); existing rows keep their value.
ALTER TABLE "social_automation_runs" ALTER COLUMN "totalSpecs" SET DEFAULT 3;
