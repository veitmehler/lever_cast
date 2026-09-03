-- Story-arc narrator profile (engagement v2)
ALTER TABLE "brand_settings" ADD COLUMN "storyNarratorName" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "storyBeats" TEXT;
ALTER TABLE "site_pages" ADD COLUMN "storyArcJson" JSONB;
ALTER TABLE "newsletters" ADD COLUMN "storyArcJson" JSONB;
