-- Wave 0: GHL integration + social post provider fields

CREATE TABLE "ghl_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ghlApiKey" TEXT,
    "ghlLocationId" TEXT,
    "ghlUserId" TEXT,
    "accountIds" JSONB,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ghl_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ghl_settings_userId_key" ON "ghl_settings"("userId");

ALTER TABLE "ghl_settings" ADD CONSTRAINT "ghl_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "posts" ADD COLUMN     "postType" TEXT,
ADD COLUMN     "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videoUrl" TEXT,
ADD COLUMN     "postAsStory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "ghlPostId" TEXT,
ADD COLUMN     "automationRunId" TEXT;

CREATE INDEX "posts_provider_status_idx" ON "posts"("provider", "status");
