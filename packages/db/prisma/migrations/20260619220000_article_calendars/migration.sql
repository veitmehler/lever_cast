-- Admin-curated article content calendars (separate from newsletters; same
-- specialization × hemisphere routing). Accounts are auto-routed via
-- accounts.articleCalendarId.

-- CreateTable
CREATE TABLE "article_calendars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "specializationKey" TEXT,
    "hemisphere" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_calendars_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "article_calendars_specializationKey_hemisphere_key" ON "article_calendars"("specializationKey", "hemisphere");

-- CreateTable
CREATE TABLE "article_calendar_topics" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT NOT NULL,
    "angle" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outlineFrameworkNumber" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_calendar_topics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "article_calendar_topics_calendarId_date_key" ON "article_calendar_topics"("calendarId", "date");
CREATE INDEX "article_calendar_topics_calendarId_idx" ON "article_calendar_topics"("calendarId");

ALTER TABLE "article_calendar_topics"
  ADD CONSTRAINT "article_calendar_topics_calendarId_fkey"
  FOREIGN KEY ("calendarId") REFERENCES "article_calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: account-level article calendar routing
ALTER TABLE "accounts" ADD COLUMN "articleCalendarId" TEXT;
CREATE INDEX "accounts_articleCalendarId_idx" ON "accounts"("articleCalendarId");
ALTER TABLE "accounts"
  ADD CONSTRAINT "accounts_articleCalendarId_fkey"
  FOREIGN KEY ("articleCalendarId") REFERENCES "article_calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
