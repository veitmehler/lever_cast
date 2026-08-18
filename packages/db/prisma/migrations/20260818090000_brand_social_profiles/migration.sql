-- Org social profile URLs for JSON-LD publisher.sameAs
ALTER TABLE "BrandSettings" ADD COLUMN "socialProfileUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
