-- Preview-first social automation: spec preview payload, approval timestamp, social logo override.
-- Post/run status values 'ready' and 'scheduling' are application-level (TEXT columns unchanged).

ALTER TABLE "social_automation_spec_results" ADD COLUMN "previewJson" JSONB;
ALTER TABLE "social_automation_spec_results" ADD COLUMN "approvedAt" TIMESTAMP(3);

ALTER TABLE "brand_settings" ADD COLUMN "socialLogoUrl" TEXT;
