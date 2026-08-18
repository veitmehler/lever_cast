-- Org social profile URLs for JSON-LD publisher.sameAs
ALTER TABLE "brand_settings" ADD COLUMN "socialProfileUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
