-- Wipe existing newsletter calendars (cascades topics + editions; user FK SetNull).
DELETE FROM "newsletter_calendars";

-- CreateTable: admin-managed specializations
CREATE TABLE "specializations" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "specializations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "specializations_key_key" ON "specializations"("key");

-- Seed the starting specializations
INSERT INTO "specializations" ("id","key","label","sortOrder","updatedAt") VALUES
  ('spec_family_care','family_care','Family Care',1,CURRENT_TIMESTAMP),
  ('spec_sports','sports','Sports',2,CURRENT_TIMESTAMP),
  ('spec_prenatal_pediatric','prenatal_pediatric','Prenatal/Pediatric',3,CURRENT_TIMESTAMP),
  ('spec_geriatric','geriatric','Geriatric',4,CURRENT_TIMESTAMP),
  ('spec_wellness_maintenance','wellness_maintenance','Wellness/Maintenance',5,CURRENT_TIMESTAMP);

-- AlterTable: newsletter_calendars → specializationKey + hemisphere
ALTER TABLE "newsletter_calendars" DROP COLUMN "specialization";
ALTER TABLE "newsletter_calendars" ADD COLUMN "specializationKey" TEXT;
ALTER TABLE "newsletter_calendars" ADD COLUMN "hemisphere" TEXT;
CREATE UNIQUE INDEX "newsletter_calendars_specializationKey_hemisphere_key" ON "newsletter_calendars"("specializationKey","hemisphere");

-- AlterTable: brand_settings → deterministic specialization fields
ALTER TABLE "brand_settings"
  ADD COLUMN "specializations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "primarySpecialization" TEXT,
  ADD COLUMN "hemisphereOverride" TEXT;
