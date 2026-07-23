-- Google reviews acquisition ladder + QR card: place identity + review webhook token.
ALTER TABLE "brand_settings" ADD COLUMN "googlePlaceId" TEXT;
ALTER TABLE "accounts" ADD COLUMN "ghlReviewToken" TEXT;
CREATE UNIQUE INDEX "accounts_ghlReviewToken_key" ON "accounts"("ghlReviewToken");
