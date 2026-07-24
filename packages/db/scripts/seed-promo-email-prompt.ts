/**
 * Targeted seeder for the promotional-email prompt (PromptTemplate step 32).
 *
 * Safe to run against any environment: it upserts ONLY step 32 and never
 * overwrites an existing row (update: {}). Unlike the full `seed.ts`, it does
 * not touch platform settings, outline frameworks, or other prompts — so it's
 * safe on staging/prod where those are tuned.
 *
 * Run (env must point at the target DB):
 *   pnpm --filter @omniply/db exec tsx scripts/seed-promo-email-prompt.ts
 *
 * Keep this template identical to PROMO_EMAIL_TEMPLATE in prisma/seed.ts.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const PROMO_EMAIL_TEMPLATE = {
  stepNumber: 32,
  stepName: 'generate_promotional_email',
  defaultProvider: 'anthropic',
  defaultModel: 'claude-sonnet-4-5-20250929',
  maxTokens: 2000,
  systemPrompt:
    'You are an expert email marketer who writes short, high-converting promotional emails that drive clicks to a newly published article. ' +
    'You write a compelling subject line and a concise, scannable HTML email body. ' +
    'The body must be valid, email-safe HTML (use <p>, <strong>, <ul>/<li>, and <a href> only — no <html>, <head>, <body>, <style>, or <script> tags, no external CSS). ' +
    'Always include exactly one clear call-to-action link to the article. ' +
    'Output ONLY a single JSON object and nothing else, in the exact shape: ' +
    '{"subject": "<subject line>", "bodyHtml": "<email body html>"}. ' +
    'Do not wrap the JSON in markdown code fences. Do not add commentary.',
  userPrompt: `Write a promotional email announcing this newly published article to our newsletter audience.

ARTICLE TITLE: {{title}}

PRIMARY KEYWORD: {{primary_keyword}}

ARTICLE EXCERPT / SUMMARY: {{excerpt}}

ARTICLE URL: {{article_url}}

FULL ARTICLE BODY (for context — do NOT reproduce it):
{{article_body}}

---

Requirements:
- Subject line: 4–9 words, curiosity-driven, no clickbait, no emoji.
- Body: 90–160 words of valid email-safe HTML.
- Open with a hook tied to the reader's problem, give 2–3 concrete reasons to read the article, then a single call-to-action button/link pointing to {{article_url}} (use an <a href> with anchor text like "Read the full article").
- Warm, professional, second-person ("you") tone. No "Dear reader". No signature block.
- If {{article_url}} is empty, still write the email but make the CTA link text "Read the full article" with href="#".

Output ONLY the JSON object: {"subject": "...", "bodyHtml": "..."}`,
  isActive: true,
}

async function main() {
  const existing = await prisma.promptTemplate.findUnique({
    where: { stepNumber: PROMO_EMAIL_TEMPLATE.stepNumber },
    select: { id: true },
  })
  await prisma.promptTemplate.upsert({
    where: { stepNumber: PROMO_EMAIL_TEMPLATE.stepNumber },
    create: PROMO_EMAIL_TEMPLATE,
    update: {}, // never clobber an admin-edited prompt
  })
  console.log(
    existing
      ? `Step ${PROMO_EMAIL_TEMPLATE.stepNumber} already existed — left unchanged.`
      : `Seeded step ${PROMO_EMAIL_TEMPLATE.stepNumber}: ${PROMO_EMAIL_TEMPLATE.stepName}.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
