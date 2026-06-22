-- Clerk invitation tracking for roster members (closed sign-ups → invite-only).
ALTER TABLE "account_members" ADD COLUMN "clerkInvitationId" TEXT;
ALTER TABLE "account_members" ADD COLUMN "inviteUrl" TEXT;
