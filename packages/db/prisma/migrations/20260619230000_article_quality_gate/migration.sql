-- Auto quality gate fields on ArticleJob.
ALTER TABLE "article_jobs" ADD COLUMN "qualityStatus" TEXT;
ALTER TABLE "article_jobs" ADD COLUMN "qualityVerdict" JSONB;
ALTER TABLE "article_jobs" ADD COLUMN "qualityAttempts" INTEGER NOT NULL DEFAULT 0;
