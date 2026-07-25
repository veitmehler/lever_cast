-- Stripe-central billing: account binding columns + webhook event table.
ALTER TABLE "accounts" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "accounts" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "accounts" ADD COLUMN "ghlContactId" TEXT;
CREATE UNIQUE INDEX "accounts_stripeCustomerId_key" ON "accounts"("stripeCustomerId");
CREATE UNIQUE INDEX "accounts_stripeSubscriptionId_key" ON "accounts"("stripeSubscriptionId");

CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "email" TEXT,
    "contactId" TEXT,
    "subscriptionId" TEXT,
    "accountId" TEXT,
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "stripe_events_stripeEventId_key" ON "stripe_events"("stripeEventId");
CREATE INDEX "stripe_events_matched_createdAt_idx" ON "stripe_events"("matched", "createdAt");
CREATE INDEX "stripe_events_subscriptionId_idx" ON "stripe_events"("subscriptionId");
