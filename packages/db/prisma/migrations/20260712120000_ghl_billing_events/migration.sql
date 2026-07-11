-- Multi-tenancy hardening Phase B: GHL billing webhook receiver.
ALTER TABLE "accounts" ADD COLUMN "ghlBillingToken" TEXT;
CREATE UNIQUE INDEX "accounts_ghlBillingToken_key" ON "accounts"("ghlBillingToken");

CREATE TABLE "ghl_billing_events" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duplicate" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ghl_billing_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ghl_billing_events_accountId_type_createdAt_idx" ON "ghl_billing_events"("accountId", "type", "createdAt");

ALTER TABLE "ghl_billing_events" ADD CONSTRAINT "ghl_billing_events_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
