/**
 * Targeted seeder for the plain-language storytelling prompts (`pl_*`) and the
 * per-industry PlainLanguageConfig exemplar banks.
 *
 * Safe to run against any environment: it upserts ONLY these rows (by string
 * `key` / `industry`) and never overwrites an existing row (update: {}).
 *
 * Needed on STAGING because deploy-api-staging.yml runs migrate deploy only —
 * it does NOT run the seed step (prod does, via deploy-api.yml).
 *
 * Run (env must point at the target DB — root .env points at socioply_staging):
 *   set -a; . ./.env; set +a; pnpm --filter @socioply/db exec tsx scripts/seed-plain-language-prompts.ts
 *
 * Source of truth: prisma/plain-language-prompts.ts.
 */
import { PrismaClient } from '@prisma/client'
import { PLAIN_LANGUAGE_TEMPLATES, PLAIN_LANGUAGE_CONFIGS } from '../prisma/plain-language-prompts'

const prisma = new PrismaClient()

async function main() {
  let created = 0
  let skipped = 0
  for (const template of PLAIN_LANGUAGE_TEMPLATES) {
    const existing = await prisma.promptTemplate.findUnique({
      where: { key: template.key },
      select: { id: true },
    })
    await prisma.promptTemplate.upsert({
      where: { key: template.key },
      create: template,
      update: {},
    })
    if (existing) {
      skipped++
      console.log(`  • ${template.key} already existed — left unchanged.`)
    } else {
      created++
      console.log(`  ✓ ${template.key}: ${template.stepName}`)
    }
  }
  console.log(`\nPlain-language prompts: ${created} seeded, ${skipped} left unchanged.`)

  let cfgCreated = 0
  let cfgSkipped = 0
  for (const config of PLAIN_LANGUAGE_CONFIGS) {
    const existing = await prisma.plainLanguageConfig.findUnique({
      where: { industry: config.industry },
      select: { id: true },
    })
    await prisma.plainLanguageConfig.upsert({
      where: { industry: config.industry },
      create: config,
      update: {},
    })
    if (existing) {
      cfgSkipped++
      console.log(`  • config "${config.industry}" already existed — left unchanged.`)
    } else {
      cfgCreated++
      console.log(`  ✓ config: ${config.industry}`)
    }
  }
  console.log(`Plain-language configs: ${cfgCreated} seeded, ${cfgSkipped} left unchanged.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
