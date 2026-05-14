-- AlterTable
ALTER TABLE "brand_settings" ADD COLUMN IF NOT EXISTS "industry" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN IF NOT EXISTS "businessDescription" TEXT;
