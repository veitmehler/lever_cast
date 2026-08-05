-- Chat agent C2: remember the GHL contact a conversation created so the
-- email-afterward flow can patch it (add_contact_email action).
ALTER TABLE "agent_conversations" ADD COLUMN "ghlContactId" TEXT;
