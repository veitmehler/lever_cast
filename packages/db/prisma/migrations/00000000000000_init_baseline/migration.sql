-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentRaw" TEXT NOT NULL,
    "linkedinContent" TEXT,
    "twitterContent" TEXT,
    "facebookContent" TEXT,
    "instagramContent" TEXT,
    "telegramContent" TEXT,
    "threadsContent" TEXT,
    "platforms" TEXT NOT NULL,
    "templateId" TEXT,
    "attachedImage" TEXT,
    "imageGenerationPrompt" TEXT,
    "imageGenerationProvider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "draftId" TEXT,
    "parentPostId" TEXT,
    "threadOrder" INTEGER,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "postUrl" TEXT,
    "tweetId" TEXT,
    "imageUrl" TEXT,
    "postType" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrl" TEXT,
    "postAsStory" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT,
    "ghlPostId" TEXT,
    "automationRunId" TEXT,
    "slotKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "errorMsg" TEXT,
    "analyticsLastSyncedAt" TIMESTAMP(3),
    "analyticsData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_automation_runs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "sitePageId" TEXT,
    "scheduledDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalSpecs" INTEGER NOT NULL DEFAULT 12,
    "completedSpecs" INTEGER NOT NULL DEFAULT 0,
    "failedSpecs" INTEGER NOT NULL DEFAULT 0,
    "currentSpec" TEXT,
    "error" TEXT,
    "groupId" TEXT,
    "slideCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_automation_spec_results" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "postsCreated" INTEGER NOT NULL DEFAULT 0,
    "assetsJson" JSONB,
    "previewJson" JSONB,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_automation_spec_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_post_specs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "timeHour" INTEGER NOT NULL,
    "timeMinute" INTEGER NOT NULL,
    "postType" TEXT NOT NULL,
    "isStory" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_post_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ghl_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ghlApiKey" TEXT,
    "ghlLocationId" TEXT,
    "ghlUserId" TEXT,
    "accountIds" JSONB,
    "lastVerifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ghl_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "sidebarState" TEXT NOT NULL DEFAULT 'open',
    "defaultProvider" TEXT,
    "defaultModel" TEXT,
    "defaultImageProvider" TEXT,
    "defaultImageModel" TEXT,
    "defaultImageStyle" TEXT,
    "defaultImagePromptLlmProvider" TEXT,
    "defaultImagePromptLlmModel" TEXT,
    "writingStyle" TEXT,
    "telegramChatId" TEXT,
    "elevenLabsVoiceId" TEXT,
    "elevenLabsModelId" TEXT DEFAULT 'eleven_multilingual_v2',
    "voiceoverEnabled" BOOLEAN NOT NULL DEFAULT false,
    "voiceoverStability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "voiceoverSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "voiceoverSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "socialTimezone" TEXT DEFAULT 'America/New_York',
    "socialAutomationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkedinTemplate" TEXT NOT NULL,
    "twitterTemplate" TEXT NOT NULL,
    "facebookTemplate" TEXT,
    "instagramTemplate" TEXT,
    "telegramTemplate" TEXT,
    "threadsTemplate" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "appType" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "platformUserId" TEXT,
    "platformUsername" TEXT,
    "postTargetType" TEXT,
    "selectedPageId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitter_api_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "twitter_api_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_states" (
    "state" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "codeVerifier" TEXT,
    "target" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_states_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'upload',
    "title" TEXT,
    "prompt" TEXT,
    "provider" TEXT,
    "jobId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "seoPlugin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wordpress_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "excludedKeywords" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mode" TEXT NOT NULL DEFAULT 'social_only',
    "defaultOutputTargets" TEXT[],
    "wordPressConnectionId" TEXT,
    "slug" TEXT,
    "category" TEXT,
    "publishingDate" TIMESTAMP(3),
    "outlineFrameworkNumber" INTEGER,
    "outlineSpecialInstructions" TEXT,
    "realCaseStudies" TEXT,
    "outlineFrameworkSource" TEXT,
    "wpCategoryId" INTEGER,
    "wpTagIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "skipSocialMedia" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "syndication_articles" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "provider" TEXT,
    "model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "syndication_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "userPrompt" TEXT NOT NULL,
    "variables" JSONB,
    "defaultProvider" TEXT NOT NULL DEFAULT 'gemini',
    "defaultModel" TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
    "maxTokens" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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
    "schemaJson" TEXT,
    "enrichmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "enrichmentError" TEXT,
    "enrichedAt" TIMESTAMP(3),
    "keyTakeawaysHtml" TEXT,
    "tocHtml" TEXT,

    CONSTRAINT "site_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_enrichments" (
    "id" TEXT NOT NULL,
    "sitePageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "originalH2" TEXT NOT NULL,
    "question" TEXT,
    "summary" TEXT,
    "questionSource" TEXT,
    "llmProvider" TEXT,
    "llmModel" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "section_enrichments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_diagrams" (
    "id" TEXT NOT NULL,
    "sitePageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionAnchor" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "caption" TEXT,
    "mermaidSyntax" TEXT NOT NULL,
    "svgContent" TEXT NOT NULL,
    "svgS3Key" TEXT,
    "pngS3Key" TEXT,
    "pngWidth" INTEGER,
    "pngHeight" INTEGER,
    "pngDarkS3Key" TEXT,
    "pngDarkWidth" INTEGER,
    "pngDarkHeight" INTEGER,
    "pngGeneratedAt" TIMESTAMP(3),
    "llmProvider" TEXT NOT NULL,
    "llmModel" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_diagrams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "system_api_keys" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outline_frameworks" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outline_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "googleGuidelines" TEXT,
    "schemaTypeRules" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "geolocation" TEXT,
    "industry" TEXT,
    "businessDescription" TEXT,
    "who" TEXT,
    "ourExperience" TEXT,
    "articleGoal" TEXT,
    "specialInstructions" TEXT,
    "defaultAuthorName" TEXT,
    "defaultAuthorWebsite" TEXT,
    "defaultAuthorLinkedIn" TEXT,
    "defaultAuthorJobTitle" TEXT,
    "defaultAuthorAlumniOf" TEXT,
    "schemaArticleType" TEXT,
    "organizationName" TEXT,
    "organizationWebsite" TEXT,
    "organizationEmail" TEXT,
    "organizationPhone" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "addressLocality" TEXT,
    "addressRegion" TEXT,
    "postalCode" TEXT,
    "addressCountryName" TEXT,
    "organizationAddress" TEXT,
    "organizationCountryCode" VARCHAR(2),
    "organizationLogoUrl" TEXT,
    "socialLogoUrl" TEXT,
    "socialAccountName" TEXT,
    "instagramVerified" BOOLEAN NOT NULL DEFAULT false,
    "videoSpecialInstructions" TEXT,
    "socialCallToAction" TEXT,
    "googleBusinessProfileUrl" TEXT,
    "socialMediaLinks" JSONB,
    "diagramPrimaryColor" TEXT,
    "diagramPrimaryTextColor" TEXT,
    "diagramSecondaryColor" TEXT,
    "diagramLineColor" TEXT,
    "diagramTextColor" TEXT,
    "diagramFontFamily" TEXT,
    "articleFontFamily" TEXT,
    "articleFontWeight" TEXT,
    "articleFontSizeBase" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "drafts_userId_status_idx" ON "drafts"("userId", "status");

-- CreateIndex
CREATE INDEX "posts_userId_platform_publishedAt_idx" ON "posts"("userId", "platform", "publishedAt");

-- CreateIndex
CREATE INDEX "posts_draftId_idx" ON "posts"("draftId");

-- CreateIndex
CREATE INDEX "posts_userId_scheduledAt_status_idx" ON "posts"("userId", "scheduledAt", "status");

-- CreateIndex
CREATE INDEX "posts_parentPostId_idx" ON "posts"("parentPostId");

-- CreateIndex
CREATE INDEX "posts_tweetId_idx" ON "posts"("tweetId");

-- CreateIndex
CREATE INDEX "posts_draftId_threadOrder_idx" ON "posts"("draftId", "threadOrder");

-- CreateIndex
CREATE INDEX "posts_provider_status_idx" ON "posts"("provider", "status");

-- CreateIndex
CREATE INDEX "posts_automationRunId_idx" ON "posts"("automationRunId");

-- CreateIndex
CREATE INDEX "social_automation_runs_userId_status_idx" ON "social_automation_runs"("userId", "status");

-- CreateIndex
CREATE INDEX "social_automation_runs_jobId_idx" ON "social_automation_runs"("jobId");

-- CreateIndex
CREATE INDEX "social_automation_runs_status_updatedAt_idx" ON "social_automation_runs"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "social_automation_spec_results_runId_status_idx" ON "social_automation_spec_results"("runId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "social_automation_spec_results_runId_slotKey_key" ON "social_automation_spec_results"("runId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "social_post_specs_userId_slotKey_key" ON "social_post_specs"("userId", "slotKey");

-- CreateIndex
CREATE UNIQUE INDEX "ghl_settings_userId_key" ON "ghl_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_userId_key" ON "settings"("userId");

-- CreateIndex
CREATE INDEX "templates_userId_isDefault_idx" ON "templates"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "social_connections_userId_isActive_idx" ON "social_connections"("userId", "isActive");

-- CreateIndex
CREATE INDEX "social_connections_userId_platform_appType_idx" ON "social_connections"("userId", "platform", "appType");

-- CreateIndex
CREATE UNIQUE INDEX "social_connections_userId_platform_appType_key" ON "social_connections"("userId", "platform", "appType");

-- CreateIndex
CREATE INDEX "twitter_api_requests_userId_requestedAt_idx" ON "twitter_api_requests"("userId", "requestedAt");

-- CreateIndex
CREATE INDEX "oauth_states_expiresAt_idx" ON "oauth_states"("expiresAt");

-- CreateIndex
CREATE INDEX "oauth_states_clerkId_platform_idx" ON "oauth_states"("clerkId", "platform");

-- CreateIndex
CREATE INDEX "media_userId_idx" ON "media"("userId");

-- CreateIndex
CREATE INDEX "media_userId_deletedAt_createdAt_idx" ON "media"("userId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "media_userId_source_idx" ON "media"("userId", "source");

-- CreateIndex
CREATE INDEX "wordpress_connections_userId_idx" ON "wordpress_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wordpress_connections_userId_siteUrl_key" ON "wordpress_connections"("userId", "siteUrl");

-- CreateIndex
CREATE INDEX "topics_userId_idx" ON "topics"("userId");

-- CreateIndex
CREATE INDEX "topics_scheduledDate_idx" ON "topics"("scheduledDate");

-- CreateIndex
CREATE INDEX "topics_status_idx" ON "topics"("status");

-- CreateIndex
CREATE INDEX "topics_mode_idx" ON "topics"("mode");

-- CreateIndex
CREATE INDEX "article_jobs_userId_idx" ON "article_jobs"("userId");

-- CreateIndex
CREATE INDEX "article_jobs_status_idx" ON "article_jobs"("status");

-- CreateIndex
CREATE INDEX "syndication_articles_userId_idx" ON "syndication_articles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "syndication_articles_jobId_platform_key" ON "syndication_articles"("jobId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_steps_jobId_stepNumber_key" ON "pipeline_steps"("jobId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_stepNumber_key" ON "prompt_templates"("stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_jobId_key" ON "site_pages"("jobId");

-- CreateIndex
CREATE INDEX "site_pages_primaryKeyword_idx" ON "site_pages"("primaryKeyword");

-- CreateIndex
CREATE INDEX "site_pages_userId_idx" ON "site_pages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "site_pages_userId_slug_key" ON "site_pages"("userId", "slug");

-- CreateIndex
CREATE INDEX "section_enrichments_userId_question_idx" ON "section_enrichments"("userId", "question");

-- CreateIndex
CREATE INDEX "section_enrichments_sitePageId_idx" ON "section_enrichments"("sitePageId");

-- CreateIndex
CREATE UNIQUE INDEX "section_enrichments_sitePageId_position_key" ON "section_enrichments"("sitePageId", "position");

-- CreateIndex
CREATE INDEX "article_diagrams_sitePageId_idx" ON "article_diagrams"("sitePageId");

-- CreateIndex
CREATE UNIQUE INDEX "article_diagrams_sitePageId_position_key" ON "article_diagrams"("sitePageId", "position");

-- CreateIndex
CREATE INDEX "output_attempts_jobId_idx" ON "output_attempts"("jobId");

-- CreateIndex
CREATE INDEX "output_attempts_userId_target_idx" ON "output_attempts"("userId", "target");

-- CreateIndex
CREATE INDEX "error_logs_userId_idx" ON "error_logs"("userId");

-- CreateIndex
CREATE INDEX "error_logs_jobId_idx" ON "error_logs"("jobId");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- CreateIndex
CREATE INDEX "llm_usage_userId_createdAt_idx" ON "llm_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "llm_usage_jobId_idx" ON "llm_usage"("jobId");

-- CreateIndex
CREATE INDEX "llm_usage_source_idx" ON "llm_usage"("source");

-- CreateIndex
CREATE UNIQUE INDEX "system_api_keys_provider_key" ON "system_api_keys"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "outline_frameworks_number_key" ON "outline_frameworks"("number");

-- CreateIndex
CREATE UNIQUE INDEX "brand_settings_userId_key" ON "brand_settings"("userId");

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_automationRunId_fkey" FOREIGN KEY ("automationRunId") REFERENCES "social_automation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_automation_runs" ADD CONSTRAINT "social_automation_runs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_automation_runs" ADD CONSTRAINT "social_automation_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_automation_runs" ADD CONSTRAINT "social_automation_runs_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_automation_spec_results" ADD CONSTRAINT "social_automation_spec_results_runId_fkey" FOREIGN KEY ("runId") REFERENCES "social_automation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_post_specs" ADD CONSTRAINT "social_post_specs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ghl_settings" ADD CONSTRAINT "ghl_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitter_api_requests" ADD CONSTRAINT "twitter_api_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordpress_connections" ADD CONSTRAINT "wordpress_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_wordPressConnectionId_fkey" FOREIGN KEY ("wordPressConnectionId") REFERENCES "wordpress_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_jobs" ADD CONSTRAINT "article_jobs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_jobs" ADD CONSTRAINT "article_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syndication_articles" ADD CONSTRAINT "syndication_articles_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_steps" ADD CONSTRAINT "pipeline_steps_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_steps" ADD CONSTRAINT "pipeline_steps_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "prompt_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_pages" ADD CONSTRAINT "site_pages_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_enrichments" ADD CONSTRAINT "section_enrichments_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_enrichments" ADD CONSTRAINT "section_enrichments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_diagrams" ADD CONSTRAINT "article_diagrams_sitePageId_fkey" FOREIGN KEY ("sitePageId") REFERENCES "site_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "output_attempts" ADD CONSTRAINT "output_attempts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_logs" ADD CONSTRAINT "error_logs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "article_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_settings" ADD CONSTRAINT "brand_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

