-- Multi-tenancy hardening Phase C: LLMUsage survives account deletion as
-- anonymous cost records (userId nullable, FK ON DELETE SET NULL).
ALTER TABLE "llm_usage" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "llm_usage" DROP CONSTRAINT "llm_usage_userId_fkey";
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
