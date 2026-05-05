-- AlterTable: add svgS3Key column to article_diagrams
ALTER TABLE "article_diagrams" ADD COLUMN "svgS3Key" TEXT;
