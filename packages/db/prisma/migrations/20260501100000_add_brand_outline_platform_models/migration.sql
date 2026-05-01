-- AlterTable: add new Topic fields
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "outlineSpecialInstructions" TEXT;
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "realCaseStudies" TEXT;
ALTER TABLE "topics" ADD COLUMN IF NOT EXISTS "outlineFrameworkSource" TEXT;

-- CreateTable: outline_frameworks
CREATE TABLE IF NOT EXISTS "outline_frameworks" (
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

-- CreateTable: platform_settings (singleton)
CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "googleGuidelines" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: brand_settings (per-user)
CREATE TABLE IF NOT EXISTS "brand_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "geolocation" TEXT,
    "who" TEXT,
    "ourExperience" TEXT,
    "articleGoal" TEXT,
    "specialInstructions" TEXT,
    "defaultAuthorName" TEXT,
    "defaultAuthorWebsite" TEXT,
    "organizationName" TEXT,
    "organizationWebsite" TEXT,
    "organizationEmail" TEXT,
    "organizationPhone" TEXT,
    "organizationAddress" TEXT,
    "socialMediaLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "outline_frameworks_number_key" ON "outline_frameworks"("number");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "brand_settings_userId_key" ON "brand_settings"("userId");

-- AddForeignKey (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'brand_settings_userId_fkey'
  ) THEN
    ALTER TABLE "brand_settings"
      ADD CONSTRAINT "brand_settings_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
