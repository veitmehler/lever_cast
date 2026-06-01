-- Wave 2: Per-user ElevenLabs voice settings

ALTER TABLE "settings" ADD COLUMN     "elevenLabsVoiceId" TEXT,
ADD COLUMN     "elevenLabsModelId" TEXT DEFAULT 'eleven_multilingual_v2',
ADD COLUMN     "voiceoverEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voiceoverStability" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "voiceoverSimilarity" DOUBLE PRECISION NOT NULL DEFAULT 0.75;
