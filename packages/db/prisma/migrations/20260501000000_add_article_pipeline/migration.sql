-- AlterTable: add role column to users
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- CreateTable: media
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable: wordpress_connections
CREATE TABLE "wordpress_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "appPassword" TEXT NOT NULL,
    "defaultAuthorId" INTEGER,
    "defaultStatus" TEXT NOT NULL DEFAULT 'draft',
    "defaultCategoryId" INTEGER,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wordpress_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable: topics
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "excludedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT NOT NULL DEFAULT 'social_only',
    "defaultOutputTargets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "wordPressConnectionId" TEXT,
    "slug" TEXT,
    "category" TEXT,
    "publishingDate" TIMESTAMP(3),
    "outlineFrameworkNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable: article_jobs
CREATE TABLE "article_jobs" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "enrichmentJobId" TEXT,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "enrichedAt" TIMESTAMP(3),

    CONSTRAINT "article_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: prompt_templates
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "userPrompt" TEXT NOT NULL,
    "variables" JSONB,
    "defaultProvider" TEXT NOT NULL DEFAULT 'gemini',
    "defaultModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pipeline_steps
CREATE TABLE "pipeline_steps" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "model" TEXT,
    "promptTemplateId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "output" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pipeline_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable: site_pages
CREATE TABLE "site_pages" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "originalBodyHtml" TEXT,
    "featuredImageId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "readingTime" INTEGER,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "citations" JSONB,
    "disclaimer" TEXT,
    "excerpt" VARCHAR(160),
    "primaryKeyword" TEXT,
    "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "enrichmentError" TEXT,
    "enrichedAt" TIMESTAMP(3),

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: article_diagrams
CREATE TABLE "article_diagrams" (
    "id" TEXT NOT NULL,
    "sitePageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionAnchor" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "caption" TEXT,
    "mermaidSyntax" TEXT NOT NULL,
    "svgContent" TEXT NOT NULL,
    "pngS3Key" TEXT,
    "pngWidth" INTEGER,
    "pngHeight" INTEGER,
    "pngGeneratedAt" TIMESTAMP(3),
    "llmProvider" TEXT NOT NULL,
    "llmModel" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateTable: output_attempts
CREATE TABLE "output_attempts" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "targetRefId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "resultUrl" TEXT,
    "errorMessage" TEXT,
    "payloadHash" TEXT,

    CONSTRAINT "output_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: error_logs
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "jobId" TEXT,
    "errorType" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "context" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: llm_usage
CREATE TABLE "llm_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "stepNumber" INTEGER,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: system_api_keys
CREATE TABLE "system_api_keys" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraints
CREATE UNIQUE INDEX "wordpress_connections_userId_siteUrl_key" ON "wordpress_connections"("userId", "siteUrl");
CREATE UNIQUE INDEX "prompt_templates_stepNumber_key" ON "prompt_templates"("stepNumber");
CREATE UNIQUE INDEX "pipeline_steps_jobId_stepNumber_key" ON "pipeline_steps"("jobId", "stepNumber");
CREATE UNIQUE INDEX "site_pages_jobId_key" ON "site_pages"("jobId");
CREATE UNIQUE INDEX "site_pages_userId_slug_key" ON "site_pages"("userId", "slug");
CREATE UNIQUE INDEX "article_diagrams_sitePageId_position_key" ON "article_diagrams"("sitePageId", "position");
CREATE UNIQUE INDEX "system_api_keys_provider_key" ON "system_api_keys"("provider");

-- CreateIndex: regular indexes
CREATE INDEX "media_userId_idx" ON "media"("userId");
CREATE INDEX "wordpress_connections_userId_idx" ON "wordpress_connections"("userId");
CREATE INDEX "topics_userId_idx" ON "topics"("userId");
CREATE INDEX "topics_scheduledDate_idx" ON "topics"("scheduledDate");
CREATE INDEX "topics_status_idx" ON "topics"("status");
CREATE INDEX "topics_mode_idx" ON "topics"("mode");
CREATE INDEX "article_jobs_userId_idx" ON "article_jobs"("userId");
CREATE INDEX "article_jobs_status_idx" ON "article_jobs"("status");
CREATE INDEX "site_pages_primaryKeyword_idx" ON "site_pages"("primaryKeyword");
CREATE INDEX "site_pages_userId_idx" ON "site_pages"("userId");
CREATE INDEX "article_diagrams_sitePageId_idx" ON "article_diagrams"("sitePageId");
CREATE INDEX "output_attempts_jobId_idx" ON "output_attempts"("jobId");
CREATE INDEX "output_attempts_userId_target_idx" ON "output_attempts"("userId", "target");
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");
CREATE INDEX "error_logs_jobId_idx" ON "error_logs"("jobId");
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");
CREATE INDEX "llm_usage_userId_createdAt_idx" ON "llm_usage"("userId", "createdAt");
CREATE INDEX "llm_usage_jobId_idx" ON "llm_usage"("jobId");
CREATE INDEX "llm_usage_source_idx" ON "llm_usage"("source");

-- AddForeignKey constraints
ALTER TABLE "media" ADD CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wordpress_connections" ADD CONSTRAINT "wordpress_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "topics" ADD CONSTRAINT "topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "topics" ADD CONSTRAINT "topics_wordPressConnectionId_fkey" FOREIGN KEY ("wordPressConnectionId") REFERENCES "wordpress_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "article_jobs" ADD CONSTRAINT "article_jobs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_jobs" ADD CONSTRAINT "article_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pipeline_steps" ADD CONSTRAINT "pipeline_steps_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pipeline_steps" ADD CONSTRAINT "pipeline_steps_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "prompt_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "article_diagrams" ADD CONSTRAINT "article_diagrams_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "output_attempts" ADD CONSTRAINT "output_attempts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
