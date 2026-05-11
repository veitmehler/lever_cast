-- Add organization logo URL to BrandSettings for schema markup publisher.logo
ALTER TABLE "brand_settings"
  ADD COLUMN IF NOT EXISTS "organizationLogoUrl" TEXT;
