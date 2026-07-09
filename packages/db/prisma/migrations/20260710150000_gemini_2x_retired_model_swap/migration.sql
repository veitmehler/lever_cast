-- Gemini 2.x generateContent was retired server-side for this project's key in early July 2026
-- (per-project rollout, ahead of the documented Oct 16 date; 2.0-flash officially shut down
-- June 1). Swap every stored model reference to Google's official replacements:
--   gemini-2.5-flash      -> gemini-3.5-flash
--   gemini-2.5-pro        -> gemini-3.1-pro-preview
--   gemini-2.5-flash-lite -> gemini-3.1-flash-lite
--   gemini-2.0-flash*     -> same mapping as their 2.5 counterparts
-- Physical tables verified against @@map: "prompt_templates", "settings".

-- Column default (schema.prisma PromptTemplate.defaultModel @default)
ALTER TABLE "prompt_templates" ALTER COLUMN "defaultModel" SET DEFAULT 'gemini-3.5-flash';

-- Live prompt rows (the runtime source of truth for every pipeline step)
UPDATE "prompt_templates" SET "defaultModel" = 'gemini-3.5-flash'
  WHERE "defaultModel" IN ('gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-001');
UPDATE "prompt_templates" SET "defaultModel" = 'gemini-3.1-pro-preview'
  WHERE "defaultModel" = 'gemini-2.5-pro';
UPDATE "prompt_templates" SET "defaultModel" = 'gemini-3.1-flash-lite'
  WHERE "defaultModel" IN ('gemini-2.5-flash-lite', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-lite-001');

-- Per-user settings that pin a dead Gemini model
UPDATE "settings" SET "defaultImagePromptLlmModel" = 'gemini-3.5-flash'
  WHERE "defaultImagePromptLlmModel" IN ('gemini-2.5-flash', 'gemini-2.0-flash');
UPDATE "settings" SET "defaultImagePromptLlmModel" = 'gemini-3.1-pro-preview'
  WHERE "defaultImagePromptLlmModel" = 'gemini-2.5-pro';

-- settings.defaultModel is a JSON string keyed by provider; swap dead models inside it.
-- The -lite variant must be replaced BEFORE plain -flash (prefix collision).
UPDATE "settings" SET "defaultModel" =
  replace(replace(replace("defaultModel",
    'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite'),
    'gemini-2.5-flash', 'gemini-3.5-flash'),
    'gemini-2.5-pro', 'gemini-3.1-pro-preview')
  WHERE "defaultModel" LIKE '%gemini-2.%';
