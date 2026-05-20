-- Add author schema fields to brand_settings
ALTER TABLE "brand_settings"
  ADD COLUMN "defaultAuthorJobTitle" TEXT,
  ADD COLUMN "defaultAuthorAlumniOf" TEXT,
  ADD COLUMN "schemaArticleType"     TEXT;

-- Add schema type rules to platform_settings
ALTER TABLE "platform_settings"
  ADD COLUMN "schemaTypeRules" JSONB;
