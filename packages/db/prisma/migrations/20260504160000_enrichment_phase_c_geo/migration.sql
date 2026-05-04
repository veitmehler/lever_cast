-- CreateTable
CREATE TABLE "section_enrichments" (
    "id" TEXT NOT NULL,
    "sitePageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "originalH2" TEXT NOT NULL,
    "question" TEXT,
    "summary" TEXT,
    "questionSource" TEXT,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_enrichments_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "site_pages" ADD COLUMN "keyTakeawaysHtml" TEXT,
ADD COLUMN "tocHtml" TEXT;

-- AlterTable
ALTER TABLE "topics" ADD COLUMN "wpCategoryId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "section_enrichments_sitePageId_position_key" ON "section_enrichments"("sitePageId", "position");

-- CreateIndex
CREATE INDEX "section_enrichments_userId_question_idx" ON "section_enrichments"("userId", "question");

-- CreateIndex
CREATE INDEX "section_enrichments_sitePageId_idx" ON "section_enrichments"("sitePageId");

-- AddForeignKey
ALTER TABLE "section_enrichments" ADD CONSTRAINT "section_enrichments_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_enrichments" ADD CONSTRAINT "section_enrichments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
