-- Drive ACL rotation (~600 direct shares/file cap): archived generations + rotation anchor.
ALTER TABLE "leadgen_documents" ADD COLUMN "archivedDriveFileIds" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "leadgen_documents" ADD COLUMN "rotatedAt" TIMESTAMP(3);
