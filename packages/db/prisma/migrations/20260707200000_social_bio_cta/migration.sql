-- Link-in-bio CTA management: primary CTA goal + bio-page URL on BrandSettings.
ALTER TABLE "BrandSettings" ADD COLUMN "socialPrimaryGoal" TEXT;
ALTER TABLE "BrandSettings" ADD COLUMN "socialBioUrl" TEXT;
