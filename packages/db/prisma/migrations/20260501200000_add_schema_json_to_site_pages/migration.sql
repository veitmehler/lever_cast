-- AlterTable: add schemaJson column to site_pages for LLM-generated JSON-LD (Step 16)
ALTER TABLE "site_pages" ADD COLUMN IF NOT EXISTS "schemaJson" TEXT;
