-- CreateTable: oauth_states
-- Replaces the in-memory Map in src/lib/oauth.ts with a durable, multi-instance-safe store.
-- States expire after 10 minutes; an hourly cleanup job purges expired rows.

CREATE TABLE "oauth_states" (
    "state"        TEXT NOT NULL,
    "clerkId"      TEXT NOT NULL,
    "platform"     TEXT NOT NULL,
    "codeVerifier" TEXT,
    "target"       TEXT,
    "expiresAt"    TIMESTAMP(3) NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("state")
);

-- Indexes for TTL cleanup and per-user-platform lookup
CREATE INDEX "oauth_states_expiresAt_idx" ON "oauth_states"("expiresAt");
CREATE INDEX "oauth_states_clerkId_platform_idx" ON "oauth_states"("clerkId", "platform");
