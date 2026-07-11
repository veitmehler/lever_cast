-- Weekly extra-post cap (see .plans/production-throughput.implementation-plan.md Phase 2).
-- Physical table verified against @@map: "platform_settings".

ALTER TABLE "platform_settings" ADD COLUMN "weeklyExtraPostCap" INTEGER NOT NULL DEFAULT 3;
