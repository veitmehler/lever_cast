-- Bulk content-generation batches (from the content plan).
CREATE TABLE "content_batches" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "content_batches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "content_batches_accountId_idx" ON "content_batches"("accountId");
CREATE INDEX "content_batches_status_idx" ON "content_batches"("status");

CREATE TABLE "content_batch_items" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topicId" TEXT,
    "articleJobId" TEXT,
    "newsletterTopicId" TEXT,
    "newsletterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "content_batch_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "content_batch_items_batchId_idx" ON "content_batch_items"("batchId");

ALTER TABLE "content_batch_items"
  ADD CONSTRAINT "content_batch_items_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "content_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
