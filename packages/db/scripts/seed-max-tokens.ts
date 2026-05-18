/**
 * Seed default maxTokens values for each prompt template step.
 *
 * SAFE: only updates the maxTokens column. Does NOT touch systemPrompt,
 * userPrompt, defaultProvider, defaultModel, or any other field.
 *
 * Run with:
 *   pnpm tsx scripts/seed-max-tokens.ts
 *
 * Re-running is idempotent — skips rows that already have a value
 * unless --force is passed.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Per-step maxTokens defaults.
// Steps NOT listed here are left at null (uses adapter default).
const MAX_TOKENS_BY_STEP: Record<number, number> = {
  // Phase A — Pre-approval pipeline
  0:   8192,  // generate_title            — short text
  1:   8192,  // generate_outline          — structured outline
  2:   16384, // keyword_research          — JSON output
  3:   8192,  // find_supporting_keywords  — structured keywords
  4:   8192,  // optimize_outline_seo      — revised outline
  5:   8192,  // write_search_intent_intro — intro paragraph
  6:   8192,  // research_faqs             — FAQ list
  7:   8192,  // find_faq_facts            — fact bullets
  8:   8192,  // find_article_facts        — fact bullets
  9:   16384, // write_article             — full long-form article HTML
  10:  8192,  // fact_check_article        — fact check analysis
  11:  16384, // adjust_incorrect_facts    — full rewrite of article HTML
  12:  16384, // find_citations            — JSON citation list

  // Phase B — Approval chain
  13:  16384, // generate_seo_metadata     — JSON
  15:  4096,  // generate_image_prompt     — short prompt text
  16:  4096,  // generate_schema_markup    — compact JSON-LD
  17:  512,   // generate_excerpt          — 1-2 sentence excerpt
  18:  4096,  // generate_legal_disclaimer — 2-3 paragraph disclaimer
  110: 16384, // insert_inline_citations   — full article HTML rewrite

  // Phase C — Enrichment steps run through StepRunner
  // (Steps 20, 101-108 are NOT included: they call LLM adapters directly
  //  with their own hardcoded maxTokens, bypassing StepRunner entirely.)
}

async function main() {
  const forceAll = process.argv.includes('--force')

  console.log('Seeding maxTokens for prompt templates…')
  console.log(forceAll ? '  mode: --force (overwrite existing values)' : '  mode: safe (skip rows that already have a value)')
  console.log('─'.repeat(60))

  let updated = 0
  let skipped = 0

  for (const [stepStr, maxTokens] of Object.entries(MAX_TOKENS_BY_STEP)) {
    const stepNumber = Number(stepStr)

    const existing = await prisma.promptTemplate.findUnique({
      where: { stepNumber },
      select: { id: true, stepName: true, maxTokens: true },
    })

    if (!existing) {
      console.log(`  ─ Step ${stepNumber} — NOT FOUND in DB, skipping`)
      skipped++
      continue
    }

    if (!forceAll && existing.maxTokens !== null) {
      console.log(`  ─ Step ${stepNumber} (${existing.stepName}) — already set to ${existing.maxTokens}, skipping`)
      skipped++
      continue
    }

    await prisma.promptTemplate.update({
      where: { stepNumber },
      data: { maxTokens },
    })

    console.log(`  ✓ Step ${stepNumber} (${existing.stepName}) — set maxTokens = ${maxTokens}`)
    updated++
  }

  console.log('─'.repeat(60))
  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
