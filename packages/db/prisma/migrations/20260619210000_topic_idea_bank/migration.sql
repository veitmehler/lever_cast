-- Idea bank: topics can be unscheduled ideas (scheduledDate NULL), with a
-- source tag and an optional free-form note.
ALTER TABLE "topics" ALTER COLUMN "scheduledDate" DROP NOT NULL;
ALTER TABLE "topics" ADD COLUMN "source" TEXT DEFAULT 'manual';
ALTER TABLE "topics" ADD COLUMN "notes" TEXT;
