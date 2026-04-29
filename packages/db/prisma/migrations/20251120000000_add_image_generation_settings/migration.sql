-- AlterTable
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "defaultImageProvider" TEXT,
ADD COLUMN IF NOT EXISTS "defaultImageModel" TEXT,
ADD COLUMN IF NOT EXISTS "defaultImageStyle" TEXT;

-- AlterTable
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "imageGenerationPrompt" TEXT,
ADD COLUMN IF NOT EXISTS "imageGenerationProvider" TEXT;


