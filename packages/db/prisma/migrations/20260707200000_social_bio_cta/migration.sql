-- Link-in-bio CTA management: primary CTA goal + bio-page URL on BrandSettings
-- (physical table is @@map("brand_settings")).
ALTER TABLE "brand_settings" ADD COLUMN "socialPrimaryGoal" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "socialBioUrl" TEXT;
