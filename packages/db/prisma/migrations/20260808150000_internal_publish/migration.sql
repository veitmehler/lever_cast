-- Internal publish target (omniply brand consolidation, azavea vertical only):
-- essays published to omniply.io/articles render straight from the DB.
ALTER TABLE "site_pages" ADD COLUMN "internalPublishedAt" TIMESTAMP(3);
ALTER TABLE "site_pages" ADD COLUMN "internalSlug" TEXT;
CREATE UNIQUE INDEX "site_pages_internalSlug_key" ON "site_pages"("internalSlug");
