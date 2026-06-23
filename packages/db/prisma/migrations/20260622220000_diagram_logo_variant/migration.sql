-- Watermark logo variant for restyled diagrams + cached auto-generated light/dark
-- variants (from organizationLogoUrl when no newsletter variants exist).
ALTER TABLE "brand_settings" ADD COLUMN "diagramLogoVariant" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramLogoSourceUrl" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramLogoLightUrl" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramLogoDarkUrl" TEXT;
