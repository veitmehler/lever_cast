-- Structured address sub-fields for BrandSettings (replaces the single textarea)
ALTER TABLE "brand_settings"
  ADD COLUMN IF NOT EXISTS "addressLine1"       TEXT,
  ADD COLUMN IF NOT EXISTS "addressLine2"       TEXT,
  ADD COLUMN IF NOT EXISTS "addressLocality"    TEXT,
  ADD COLUMN IF NOT EXISTS "addressRegion"      TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode"         TEXT,
  ADD COLUMN IF NOT EXISTS "addressCountryName" TEXT;
