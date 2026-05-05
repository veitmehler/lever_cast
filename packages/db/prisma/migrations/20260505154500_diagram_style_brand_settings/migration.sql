-- Brand-matched Mermaid diagram styling (enrichment init directive)
ALTER TABLE "brand_settings" ADD COLUMN "diagramPrimaryColor" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramPrimaryTextColor" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramSecondaryColor" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramLineColor" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramTextColor" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "diagramFontFamily" TEXT;
