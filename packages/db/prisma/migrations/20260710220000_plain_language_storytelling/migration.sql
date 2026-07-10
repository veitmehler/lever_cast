-- Plain-language storytelling injection (see .plans/plain-language-storytelling.implementation-plan.md).
-- Physical tables verified against @@map: "site_pages", "plain_language_config", "plain_language_blocks".

CREATE TABLE "plain_language_config" (
    "id"           TEXT NOT NULL,
    "industry"     TEXT NOT NULL,
    "exemplars"    JSONB NOT NULL,
    "restrictions" TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plain_language_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plain_language_config_industry_key" ON "plain_language_config"("industry");

CREATE TABLE "plain_language_blocks" (
    "id"              TEXT NOT NULL,
    "sitePageId"      TEXT NOT NULL,
    "sectionPosition" INTEGER NOT NULL,
    "kind"            TEXT NOT NULL,
    "subject"         TEXT NOT NULL,
    "label"           TEXT,
    "generatedText"   TEXT NOT NULL,
    "verified"        BOOLEAN NOT NULL DEFAULT false,
    "llmProvider"     TEXT,
    "llmModel"        TEXT,
    "inputTokens"     INTEGER NOT NULL DEFAULT 0,
    "outputTokens"    INTEGER NOT NULL DEFAULT 0,
    "cost"            DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plain_language_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plain_language_blocks_sitePageId_idx" ON "plain_language_blocks"("sitePageId");

ALTER TABLE "plain_language_blocks" ADD CONSTRAINT "plain_language_blocks_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
