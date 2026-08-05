-- Chat agent v1 (.plans/chat-agent-v1.implementation-plan.md): per-account
-- widget token + conversation/message audit tables (180-day retention).

ALTER TABLE "accounts" ADD COLUMN "agentWidgetToken" TEXT;
CREATE UNIQUE INDEX "accounts_agentWidgetToken_key" ON "accounts"("agentWidgetToken");

CREATE TABLE "agent_conversations" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'web',
    "visitorKey" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "endedReason" TEXT,
    "turnCount" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_conversations_accountId_createdAt_idx" ON "agent_conversations"("accountId", "createdAt");
CREATE INDEX "agent_conversations_flagged_createdAt_idx" ON "agent_conversations"("flagged", "createdAt");

ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "action" JSONB,
    "filtered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_messages_conversationId_createdAt_idx" ON "agent_messages"("conversationId", "createdAt");

ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "agent_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;