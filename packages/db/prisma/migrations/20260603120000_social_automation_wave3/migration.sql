-- Wave 3: Social automation engine

ALTER TABLE "topics" ADD COLUMN "skipSocialMedia" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "settings" ADD COLUMN "socialTimezone" TEXT DEFAULT 'America/New_York';
ALTER TABLE "settings" ADD COLUMN "socialAutomationEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "social_automation_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "sitePageId" TEXT,
    "scheduledDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalSpecs" INTEGER NOT NULL DEFAULT 12,
    "completedSpecs" INTEGER NOT NULL DEFAULT 0,
    "failedSpecs" INTEGER NOT NULL DEFAULT 0,
    "currentSpec" TEXT,
    "error" TEXT,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_automation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_post_specs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeHour" INTEGER NOT NULL,
    "timeMinute" INTEGER NOT NULL,
    "postType" TEXT NOT NULL,
    "isStory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_post_specs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "social_automation_runs_userId_status_idx" ON "social_automation_runs"("userId", "status");
CREATE INDEX "social_automation_runs_jobId_idx" ON "social_automation_runs"("jobId");
CREATE INDEX "social_automation_runs_status_updatedAt_idx" ON "social_automation_runs"("status", "updatedAt");
CREATE INDEX "posts_automationRunId_idx" ON "posts"("automationRunId");

CREATE UNIQUE INDEX "social_post_specs_userId_slotKey_key" ON "social_post_specs"("userId", "slotKey");

ALTER TABLE "social_automation_runs" ADD CONSTRAINT "social_automation_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "social_automation_runs" ADD CONSTRAINT "social_automation_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "social_automation_runs" ADD CONSTRAINT "social_automation_runs_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "social_post_specs" ADD CONSTRAINT "social_post_specs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "social_automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
