-- Client story review mining (see .plans/client-story-review-mining.implementation-plan.md).
-- Physical tables verified against @@map: "accounts", "settings", "raw_reviews",
-- "client_stories", "client_story_spider_runs".

ALTER TABLE "settings" ADD COLUMN "autoGenerateNextCycle" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "raw_reviews" (
    "id"           TEXT NOT NULL,
    "accountId"    TEXT NOT NULL,
    "fingerprint"  TEXT NOT NULL,
    "reviewText"   TEXT NOT NULL,
    "starRating"   INTEGER,
    "relativeDate" TEXT,
    "triageStatus" TEXT NOT NULL DEFAULT 'pending',
    "capturedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_reviews_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "raw_reviews_accountId_fingerprint_key" ON "raw_reviews"("accountId", "fingerprint");

ALTER TABLE "raw_reviews" ADD CONSTRAINT "raw_reviews_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "client_stories" (
    "id"             TEXT NOT NULL,
    "accountId"      TEXT NOT NULL,
    "storyText"      TEXT NOT NULL,
    "topicTags"      TEXT[],
    "sourceReviewId" TEXT NOT NULL,
    "lastUsedAt"     TIMESTAMP(3),
    "useCount"       INTEGER NOT NULL DEFAULT 0,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_stories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_stories_sourceReviewId_key" ON "client_stories"("sourceReviewId");
CREATE INDEX "client_stories_accountId_lastUsedAt_idx" ON "client_stories"("accountId", "lastUsedAt");

ALTER TABLE "client_stories" ADD CONSTRAINT "client_stories_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_stories" ADD CONSTRAINT "client_stories_sourceReviewId_fkey" FOREIGN KEY ("sourceReviewId") REFERENCES "raw_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "client_story_spider_runs" (
    "id"          TEXT NOT NULL,
    "accountId"   TEXT NOT NULL,
    "cycleStart"  TIMESTAMP(3) NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'running',
    "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "client_story_spider_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_story_spider_runs_accountId_cycleStart_key" ON "client_story_spider_runs"("accountId", "cycleStart");

ALTER TABLE "client_story_spider_runs" ADD CONSTRAINT "client_story_spider_runs_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
