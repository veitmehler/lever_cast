-- CreateTable
CREATE TABLE "article_email_campaigns" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ghlCampaignId" TEXT,
    "tagId" TEXT,
    "tagName" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_email_campaigns_jobId_key" ON "article_email_campaigns"("jobId");

-- CreateIndex
CREATE INDEX "article_email_campaigns_userId_idx" ON "article_email_campaigns"("userId");

-- CreateIndex
CREATE INDEX "article_email_campaigns_status_idx" ON "article_email_campaigns"("status");

-- AddForeignKey
ALTER TABLE "article_email_campaigns" ADD CONSTRAINT "article_email_campaigns_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ghl_settings" ADD COLUMN     "promoEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promoEmailTagId" TEXT,
ADD COLUMN     "promoEmailTagName" TEXT,
ADD COLUMN     "promoEmailSendTime" TEXT DEFAULT '09:00',
ADD COLUMN     "promoEmailTimezone" TEXT DEFAULT 'America/New_York',
ADD COLUMN     "promoEmailFromName" TEXT,
ADD COLUMN     "promoEmailFromEmail" TEXT;
