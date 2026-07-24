-- Onboarding plan Phase 0: embedded-SSO identity + onboarding gate + session.
ALTER TABLE "users" ADD COLUMN "ghlUserId" TEXT;
CREATE UNIQUE INDEX "users_ghlUserId_key" ON "users"("ghlUserId");

ALTER TABLE "accounts" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

CREATE TABLE "onboarding_sessions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'welcome',
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "stepData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_sessions_accountId_key" ON "onboarding_sessions"("accountId");

ALTER TABLE "onboarding_sessions" ADD CONSTRAINT "onboarding_sessions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
