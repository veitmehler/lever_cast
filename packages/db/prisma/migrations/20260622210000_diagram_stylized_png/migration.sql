-- AI-restyled, branded 1:1 diagram image (Nano Banana). When set, it is the
-- in-article figure; the SVG remains the fallback.
ALTER TABLE "article_diagrams" ADD COLUMN "stylizedPngS3Key" TEXT;
ALTER TABLE "article_diagrams" ADD COLUMN "stylizedPngWidth" INTEGER;
ALTER TABLE "article_diagrams" ADD COLUMN "stylizedPngHeight" INTEGER;
