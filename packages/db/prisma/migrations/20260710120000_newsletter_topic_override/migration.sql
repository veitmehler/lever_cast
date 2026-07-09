-- Account-scoped NewsletterTopic overrides (physical table @@map("newsletter_topics")).
-- See .plans/newsletter-topic-override.implementation-plan.md.

-- calendarId becomes optional: an override row has accountId set, calendarId null.
ALTER TABLE "newsletter_topics" ALTER COLUMN "calendarId" DROP NOT NULL;

ALTER TABLE "newsletter_topics" ADD COLUMN "accountId" TEXT;
ALTER TABLE "newsletter_topics" ADD COLUMN "sourceTopicId" TEXT;
ALTER TABLE "newsletter_topics" ADD COLUMN "draftedAt" TIMESTAMP(3);

CREATE INDEX "newsletter_topics_accountId_idx" ON "newsletter_topics"("accountId");

CREATE UNIQUE INDEX "newsletter_topics_accountId_date_key" ON "newsletter_topics"("accountId", "date");

ALTER TABLE "newsletter_topics" ADD CONSTRAINT "newsletter_topics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
