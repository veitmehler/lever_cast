-- Social DM agent (transport 2): per-location webhook token, mirroring
-- ghlBillingToken / ghlReviewToken.
ALTER TABLE "accounts" ADD COLUMN "ghlDmToken" TEXT;
CREATE UNIQUE INDEX "accounts_ghlDmToken_key" ON "accounts"("ghlDmToken");
