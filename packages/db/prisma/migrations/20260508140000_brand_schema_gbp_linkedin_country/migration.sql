-- Brand settings fields for richer JSON-LD (Step 16)
ALTER TABLE "brand_settings" ADD COLUMN IF NOT EXISTS "defaultAuthorLinkedIn" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN IF NOT EXISTS "googleBusinessProfileUrl" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN IF NOT EXISTS "organizationCountryCode" TEXT;
