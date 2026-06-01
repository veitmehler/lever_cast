-- AlterTable: extend media into a reusable image library
ALTER TABLE "media" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'upload',
                    ADD COLUMN     "title" TEXT,
                    ADD COLUMN     "prompt" TEXT,
                    ADD COLUMN     "provider" TEXT,
                    ADD COLUMN     "jobId" TEXT,
                    ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- Existing media rows are AI featured images from the article pipeline
UPDATE "media" SET "source" = 'ai_featured';

-- CreateIndex
CREATE INDEX "media_userId_deletedAt_createdAt_idx" ON "media"("userId", "deletedAt", "createdAt");
CREATE INDEX "media_userId_source_idx" ON "media"("userId", "source");
