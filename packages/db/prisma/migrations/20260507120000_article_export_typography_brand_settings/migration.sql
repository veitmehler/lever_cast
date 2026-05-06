-- Optional article typography for standalone HTML exports (per user brand)
ALTER TABLE "brand_settings" ADD COLUMN "articleFontFamily" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "articleFontWeight" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "articleFontSizeBase" TEXT;
