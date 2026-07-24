/**
 * Targeted seeder for the newsletter pipeline prompts (`nl_*`).
 *
 * Safe to run against any environment: it upserts ONLY the newsletter prompt
 * rows (by their string `key`) and never overwrites an existing row
 * (update: {}). Unlike the full `seed.ts`, it does not touch platform settings,
 * outline frameworks, or the article-pipeline prompts.
 *
 * Needed on STAGING because deploy-api-staging.yml runs migrate deploy only — it
 * does NOT run the seed step (prod does, via deploy-api.yml). See the
 * staging-deploy-inflight-check memory.
 *
 * Run (env must point at the target DB — root .env points at socioply_staging):
 *   set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/seed-newsletter-prompts.ts
 *
 * Source of truth for the templates: prisma/newsletter-prompts.ts.
 */
import { PrismaClient } from '@prisma/client'
import { NEWSLETTER_TEMPLATES } from '../prisma/newsletter-prompts'

const prisma = new PrismaClient()

async function main() {
  let created = 0
  let skipped = 0
  for (const template of NEWSLETTER_TEMPLATES) {
    const existing = await prisma.promptTemplate.findUnique({
      where: { key: template.key },
      select: { id: true },
    })
    await prisma.promptTemplate.upsert({
      where: { key: template.key },
      create: template,
      update: {}, // never clobber an admin-edited prompt
    })
    if (existing) {
      skipped++
      console.log(`  • ${template.key} already existed — left unchanged.`)
    } else {
      created++
      console.log(`  ✓ ${template.key}: ${template.stepName}`)
    }
  }
  console.log(`\nNewsletter prompts: ${created} seeded, ${skipped} left unchanged.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
