-- Persist per-run carousel/hook slide count (6–12) for F4 and F6
ALTER TABLE "social_automation_runs" ADD COLUMN "slideCount" INTEGER;
