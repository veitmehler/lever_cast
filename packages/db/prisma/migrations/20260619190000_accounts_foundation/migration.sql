-- Multi-user accounts foundation (additive; non-breaking).
-- Each existing user gets their own Account (1:1) so behavior is unchanged until
-- invites + account-scoped reads land in later steps.

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accounts_ownerUserId_key" ON "accounts"("ownerUserId");

-- AlterTable: User gains account membership (nullable)
ALTER TABLE "users" ADD COLUMN "accountId" TEXT;

-- Backfill: one account per existing user, linked both ways
INSERT INTO "accounts" ("id", "name", "ownerUserId", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, u."name", u."id", now(), now()
FROM "users" u;

UPDATE "users" u
SET "accountId" = a."id"
FROM "accounts" a
WHERE a."ownerUserId" = u."id";

-- Index + FK
CREATE INDEX "users_accountId_idx" ON "users"("accountId");
ALTER TABLE "users"
  ADD CONSTRAINT "users_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
