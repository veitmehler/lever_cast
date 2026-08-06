/**
 * Targeted seeder for the client-story review-mining prompts (`cs_*`).
 *
 * Safe to run against any environment: it upserts ONLY these prompt rows (by
 * their string `key`) and never overwrites an existing row (update: {}).
 *
 * Needed on STAGING because deploy-api-staging.yml runs migrate deploy only —
 * it does NOT run the seed step (prod does, via deploy-api.yml).
 *
 * Run (env must point at the target DB — root .env points at socioply_staging):
 *   set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/seed-client-story-prompts.ts
 *
 * Source of truth for the templates: prisma/client-story-prompts.ts.
 */
import { PrismaClient } from '@prisma/client'
import { CLIENT_STORY_TEMPLATES } from '../prisma/client-story-prompts'

const prisma = new PrismaClient()

async function main() {
  let created = 0
  let skipped = 0
  for (const template of CLIENT_STORY_TEMPLATES) {
    const existing = await prisma.promptTemplate.findUnique({
      where: { key_vertical: { key: template.key, vertical: 'default' } },
      select: { id: true },
    })
    await prisma.promptTemplate.upsert({
      where: { key_vertical: { key: template.key, vertical: 'default' } },
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
  console.log(`\nClient-story prompts: ${created} seeded, ${skipped} left unchanged.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
