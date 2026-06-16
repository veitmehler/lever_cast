-- AlterTable
ALTER TABLE "users" ADD COLUMN     "newsletterCalendarId" TEXT;
-- AlterTable
ALTER TABLE "prompt_templates" ADD COLUMN     "key" TEXT;
-- AlterTable
ALTER TABLE "brand_settings" ADD COLUMN     "nlBodyFontWeight" TEXT,
ADD COLUMN     "nlFontColor" TEXT,
ADD COLUMN     "nlFontFamily" TEXT,
ADD COLUMN     "nlFooterBgColor" TEXT,
ADD COLUMN     "nlHeaderBgColor" TEXT,
ADD COLUMN     "nlHeadingFontWeight" TEXT,
ADD COLUMN     "nlLinkColor" TEXT,
ADD COLUMN     "specialization" TEXT;
-- CreateTable
CREATE TABLE "newsletter_calendars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "specialization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "newsletter_calendars_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "newsletter_topics" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "bullet1" TEXT NOT NULL,
    "bullet2" TEXT NOT NULL,
    "bullet3" TEXT NOT NULL,
    "secondaryTopic" TEXT,
    "recipe" TEXT,
    "kidsSnack" TEXT,
    "techFreeActivity" TEXT,
    "videoUrl" TEXT,
    "research" JSONB,
    "researchStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "newsletter_topics_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "newsletters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "featureArticle" JSONB,
    "secondaryArticle" JSONB,
    "teasers" JSONB,
    "quickHits" JSONB,
    "fun" JSONB,
    "modules" JSONB,
    "subjectLine" TEXT,
    "previewText" TEXT,
    "renderedHtml" TEXT,
    "validation" JSONB,
    "ghlCampaignId" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "newsletters_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "newsletter_topics_calendarId_idx" ON "newsletter_topics"("calendarId");
-- CreateIndex
CREATE UNIQUE INDEX "newsletter_topics_calendarId_date_key" ON "newsletter_topics"("calendarId", "date");
-- CreateIndex
CREATE INDEX "newsletters_userId_status_idx" ON "newsletters"("userId", "status");
-- CreateIndex
CREATE INDEX "newsletters_topicId_idx" ON "newsletters"("topicId");
-- CreateIndex
CREATE UNIQUE INDEX "newsletters_userId_topicId_key" ON "newsletters"("userId", "topicId");
-- CreateIndex
CREATE INDEX "users_newsletterCalendarId_idx" ON "users"("newsletterCalendarId");
-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_key_key" ON "prompt_templates"("key");
-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_newsletterCalendarId_fkey" FOREIGN KEY ("newsletterCalendarId") REFERENCES "newsletter_calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "newsletter_topics" ADD CONSTRAINT "newsletter_topics_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "newsletter_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "newsletters" ADD CONSTRAINT "newsletters_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "newsletter_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
