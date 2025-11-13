-- AlterTable: Add appType column and update unique constraint
-- Step 1: Drop the old unique constraint
ALTER TABLE "social_connections" DROP CONSTRAINT IF EXISTS "social_connections_userId_platform_key";

-- Step 2: Add the appType column (nullable, defaults to null for existing rows)
ALTER TABLE "social_connections" ADD COLUMN IF NOT EXISTS "appType" TEXT;

-- Step 3: For existing LinkedIn connections, set appType to 'personal' as default
-- (This assumes existing connections are personal profile connections)
UPDATE "social_connections" SET "appType" = 'personal' WHERE "platform" = 'linkedin' AND "appType" IS NULL;

-- Step 4: Add the new unique constraint covering userId, platform, and appType
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_userId_platform_appType_key" UNIQUE ("userId", "platform", "appType");

-- Step 5: Add index for better query performance
CREATE INDEX IF NOT EXISTS "social_connections_userId_platform_appType_idx" ON "social_connections"("userId", "platform", "appType");

