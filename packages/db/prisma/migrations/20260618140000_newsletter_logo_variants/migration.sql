-- AlterTable: newsletter logo variants + footer disclaimer
ALTER TABLE "brand_settings"
  ADD COLUMN     "nlLogoSourceUrl" TEXT,
  ADD COLUMN     "nlLogoLightUrl" TEXT,
  ADD COLUMN     "nlLogoDarkUrl" TEXT,
  ADD COLUMN     "nlHeaderLogoVariant" TEXT,
  ADD COLUMN     "nlFooterLogoVariant" TEXT,
  ADD COLUMN     "nlFooterLogoWidth" INTEGER,
  ADD COLUMN     "nlFooterDisclaimer" TEXT;
