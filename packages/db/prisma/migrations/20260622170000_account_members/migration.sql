-- Owner-managed team roster (replaces invitations). Email-match auto-join on sign-in.
CREATE TABLE "account_members" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_members_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "account_members_email_key" ON "account_members"("email");
CREATE INDEX "account_members_accountId_idx" ON "account_members"("accountId");
ALTER TABLE "account_members"
  ADD CONSTRAINT "account_members_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
