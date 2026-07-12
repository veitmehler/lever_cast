-- Lead-gen documents via Google Drive (leadgen plan Phase 2).
ALTER TABLE "accounts" ADD COLUMN "driveFolderId" TEXT;

CREATE TABLE "leadgen_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sourceHtml" TEXT NOT NULL,
    "slotMeta" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leadgen_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "leadgen_templates_slug_key" ON "leadgen_templates"("slug");

CREATE TABLE "leadgen_documents" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'template',
    "status" TEXT NOT NULL DEFAULT 'compiling',
    "driveFileId" TEXT,
    "driveLink" TEXT,
    "pdfKey" TEXT,
    "ghlTagNames" TEXT[],
    "lastError" TEXT,
    "compiledAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "leadgen_documents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "leadgen_documents_driveFileId_key" ON "leadgen_documents"("driveFileId");
CREATE UNIQUE INDEX "leadgen_documents_accountId_slug_key" ON "leadgen_documents"("accountId", "slug");
CREATE INDEX "leadgen_documents_status_idx" ON "leadgen_documents"("status");
ALTER TABLE "leadgen_documents" ADD CONSTRAINT "leadgen_documents_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leadgen_documents" ADD CONSTRAINT "leadgen_documents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "leadgen_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "lead_captures" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "ghlContactId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'captured',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_captures_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lead_captures_proposalId_key" ON "lead_captures"("proposalId");
CREATE INDEX "lead_captures_accountId_createdAt_idx" ON "lead_captures"("accountId", "createdAt");
ALTER TABLE "lead_captures" ADD CONSTRAINT "lead_captures_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "leadgen_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_captures" ADD CONSTRAINT "lead_captures_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
