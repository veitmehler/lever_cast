-- AlterTable
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "defaultImagePromptLlmProvider" TEXT,
ADD COLUMN IF NOT EXISTS "defaultImagePromptLlmModel" TEXT;

