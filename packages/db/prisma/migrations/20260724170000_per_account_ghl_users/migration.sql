-- Per-account GHL SSO users: the same GHL human (agency admin, multi-clinic
-- owner) may open the app in several sub-accounts, each mapped to its own
-- Omniply account. One User row per (account, ghlUserId) instead of a global
-- one-account-per-GHL-user binding.
DROP INDEX IF EXISTS "users_ghlUserId_key";

CREATE UNIQUE INDEX "users_accountId_ghlUserId_key" ON "users"("accountId", "ghlUserId");

CREATE INDEX "users_ghlUserId_idx" ON "users"("ghlUserId");
