-- Billing-cycle anchor date for Content Plan windowing (physical table is @@map("accounts")).
ALTER TABLE "accounts" ADD COLUMN "subscriptionStartedAt" TIMESTAMP(3);
