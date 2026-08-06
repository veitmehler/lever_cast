/**
 * De-AI writing rollout — the SIGNED-OFF prompt overwrite (user approval
 * 2026-07-10, see .plans/de-ai-writing.implementation-plan.md decision 8).
 *
 * Unlike every other seeder, this script INTENTIONALLY OVERWRITES existing
 * rows — but ONLY the exact set approved for this improvement:
 *   - nl_teaser_summarizer_system / nl_teaser_summarizer_user (hook rewrite)
 *   - nl_article_writer_system (article_teaser hook guidance + no-dash rule)
 *   - stepNumber 203 social_platform_caption (hook rewrite)
 *   - pl_write_gloss / pl_write_story (no-dash style rule)
 *   - PlainLanguageConfig "Chiropractor" exemplars + restrictions (dash-free)
 * It also creates st_dash_fix if missing (normal create-only behavior).
 *
 * MUST be run on BOTH staging and prod after their deploys: the automatic
 * seed step is create-only and will NOT propagate changed prompt text.
 *
 * Run: set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/reseed-deai-prompts.ts
 */
import { PrismaClient } from '@prisma/client'
import { NEWSLETTER_TEMPLATES } from '../prisma/newsletter-prompts'
import { PLAIN_LANGUAGE_TEMPLATES, PLAIN_LANGUAGE_CONFIGS } from '../prisma/plain-language-prompts'
import { DEAI_TEMPLATES, CAPTION_HOOK_SYSTEM, CAPTION_HOOK_USER } from '../prisma/deai-prompts'

const prisma = new PrismaClient()

const OVERWRITE_KEYS = [
  'nl_teaser_summarizer_system',
  'nl_teaser_summarizer_user',
  'nl_article_writer_system',
  'pl_write_gloss',
  'pl_write_story',
]
const OVERWRITE_STEP_NUMBERS = [203]

async function main() {
  const keyed = [...NEWSLETTER_TEMPLATES, ...PLAIN_LANGUAGE_TEMPLATES]

  for (const key of OVERWRITE_KEYS) {
    const template = keyed.find((t) => t.key === key)
    if (!template) throw new Error(`Source template not found for key ${key}`)
    const existing = await prisma.promptTemplate.findUnique({ where: { key_vertical: { key, vertical: 'default' } }, select: { id: true, userPrompt: true, systemPrompt: true } })
    if (!existing) {
      await prisma.promptTemplate.create({ data: template })
      console.log(`  + ${key}: created (did not exist)`)
      continue
    }
    await prisma.promptTemplate.update({
      where: { key_vertical: { key, vertical: 'default' } },
      data: {
        systemPrompt: template.systemPrompt,
        userPrompt: template.userPrompt,
        maxTokens: template.maxTokens,
      },
    })
    const before = (existing.systemPrompt ?? '').length + (existing.userPrompt ?? '').length
    const after = (template.systemPrompt ?? '').length + template.userPrompt.length
    console.log(`  ⤳ ${key}: OVERWRITTEN (${before} → ${after} chars)`)
  }

  for (const stepNumber of OVERWRITE_STEP_NUMBERS) {
    // 203's canonical text lives in deai-prompts.ts (seed.ts uses the same constants).
    const existing = await prisma.promptTemplate.findFirst({
      where: { stepNumber_vertical: { stepNumber, vertical: 'default' } },
      select: { id: true, userPrompt: true, systemPrompt: true },
    })
    if (!existing) {
      await prisma.promptTemplate.create({
        data: {
          stepNumber,
          stepName: 'social_platform_caption',
          defaultProvider: 'anthropic',
          defaultModel: 'claude-sonnet-4-5-20250929',
          maxTokens: 512,
          systemPrompt: CAPTION_HOOK_SYSTEM,
          userPrompt: CAPTION_HOOK_USER,
          isActive: true,
        },
      })
      console.log(`  + step ${stepNumber}: created (did not exist)`)
      continue
    }
    await prisma.promptTemplate.update({
      where: { id: existing.id },
      data: { systemPrompt: CAPTION_HOOK_SYSTEM, userPrompt: CAPTION_HOOK_USER },
    })
    const before = (existing.systemPrompt ?? '').length + (existing.userPrompt ?? '').length
    const after = CAPTION_HOOK_SYSTEM.length + CAPTION_HOOK_USER.length
    console.log(`  ⤳ step ${stepNumber} (social_platform_caption): OVERWRITTEN (${before} → ${after} chars)`)
  }

  // Dash-free exemplars + restrictions.
  for (const config of PLAIN_LANGUAGE_CONFIGS) {
    const existing = await prisma.plainLanguageConfig.findUnique({ where: { industry: config.industry }, select: { id: true } })
    if (!existing) {
      await prisma.plainLanguageConfig.create({ data: config })
      console.log(`  + config "${config.industry}": created`)
    } else {
      await prisma.plainLanguageConfig.update({
        where: { industry: config.industry },
        data: { exemplars: config.exemplars, restrictions: config.restrictions },
      })
      console.log(`  ⤳ config "${config.industry}": exemplars + restrictions OVERWRITTEN`)
    }
  }

  // st_dash_fix — normal create-only.
  for (const template of DEAI_TEMPLATES) {
    const existing = await prisma.promptTemplate.findUnique({ where: { key_vertical: { key: template.key, vertical: 'default' } }, select: { id: true } })
    await prisma.promptTemplate.upsert({ where: { key_vertical: { key: template.key, vertical: 'default' } }, create: template, update: {} })
    console.log(existing ? `  • ${template.key}: already existed — left unchanged` : `  ✓ ${template.key}: created`)
  }

  console.log('\nDe-AI prompt rollout complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
