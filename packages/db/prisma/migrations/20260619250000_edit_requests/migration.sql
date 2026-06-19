-- Collaborative edit requests (Phase 7).
ALTER TABLE "site_pages" ADD COLUMN "reviewState" TEXT;

CREATE TABLE "article_edit_requests" (
    "id" TEXT NOT NULL,
    "sitePageId" TEXT NOT NULL,
    "reviewRoundId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "assigneeEmail" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "quotedText" TEXT NOT NULL,
    "prefixContext" TEXT,
    "suffixContext" TEXT,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "article_edit_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "article_edit_requests_sitePageId_idx" ON "article_edit_requests"("sitePageId");
CREATE INDEX "article_edit_requests_reviewRoundId_idx" ON "article_edit_requests"("reviewRoundId");

ALTER TABLE "article_edit_requests"
  ADD CONSTRAINT "article_edit_requests_sitePageId_fkey"
  FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
