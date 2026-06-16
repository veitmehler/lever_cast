-- AlterTable
ALTER TABLE "ghl_settings" ADD COLUMN     "newsletterFromEmail" TEXT,
ADD COLUMN     "newsletterFromName" TEXT,
ADD COLUMN     "newsletterSendTime" TEXT DEFAULT '09:00',
ADD COLUMN     "newsletterTagId" TEXT,
ADD COLUMN     "newsletterTagName" TEXT,
ADD COLUMN     "newsletterTimezone" TEXT DEFAULT 'America/New_York';
