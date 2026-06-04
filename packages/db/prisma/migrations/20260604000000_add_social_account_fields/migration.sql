-- AlterTable
ALTER TABLE "brand_settings" ADD COLUMN "socialAccountName" TEXT,
                             ADD COLUMN "instagramVerified" BOOLEAN NOT NULL DEFAULT false;
