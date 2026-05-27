-- CreateTable
CREATE TABLE "syndication_articles" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syndication_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "syndication_articles_jobId_platform_key" ON "syndication_articles"("jobId", "platform");

-- CreateIndex
CREATE INDEX "syndication_articles_userId_idx" ON "syndication_articles"("userId");

-- AddForeignKey
ALTER TABLE "syndication_articles" ADD CONSTRAINT "syndication_articles_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
