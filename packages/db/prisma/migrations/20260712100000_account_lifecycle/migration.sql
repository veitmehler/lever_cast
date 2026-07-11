-- Multi-tenancy hardening Phase A: account lifecycle state machine.
ALTER TABLE "accounts" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "accounts" ADD COLUMN "statusChangedAt" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN "paidThrough" TIMESTAMP(3);
ALTER TABLE "accounts" ADD COLUMN "billingExempt" BOOLEAN NOT NULL DEFAULT false;
