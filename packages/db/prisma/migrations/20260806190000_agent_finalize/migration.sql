-- Agent conversation finalizer (contact-convergence batch): inactivity
-- reconciliation pass marks conversations finalized.
ALTER TABLE "agent_conversations" ADD COLUMN "finalizedAt" TIMESTAMP(3);
