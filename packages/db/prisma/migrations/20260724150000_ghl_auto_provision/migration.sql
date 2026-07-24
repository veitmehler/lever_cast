-- Auto-provisioning from marketplace app installs (agency OAuth grant + location tokens).
CREATE TABLE "ghl_app_tokens" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ghl_app_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ghl_app_tokens_companyId_key" ON "ghl_app_tokens"("companyId");
ALTER TABLE "ghl_settings" ADD COLUMN "ghlAuthType" TEXT NOT NULL DEFAULT 'pi';
ALTER TABLE "ghl_settings" ADD COLUMN "ghlTokenExpiresAt" TIMESTAMP(3);
