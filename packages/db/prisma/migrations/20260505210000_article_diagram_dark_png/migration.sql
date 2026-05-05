-- Dark-theme PNG exports for diagrams (social / dark UI)
ALTER TABLE "article_diagrams" ADD COLUMN "pngDarkS3Key" TEXT;
ALTER TABLE "article_diagrams" ADD COLUMN "pngDarkWidth" INTEGER;
ALTER TABLE "article_diagrams" ADD COLUMN "pngDarkHeight" INTEGER;
