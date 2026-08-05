/**
 * Targeted seeder for the chat-agent prompts (`agent_*`).
 *
 * Safe to run against any environment: upserts ONLY the agent prompt rows (by
 * string `key`) and never overwrites an existing row (update: {}) — admin
 * edits from /admin/agents survive re-seeding.
 *
 * Needed on STAGING because deploy-api-staging.yml runs migrate deploy only —
 * it does NOT run the seed step (prod does, via deploy-api.yml).
 *
 * Run (env must point at the target DB — root .env points at socioply_staging):
 *   set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/seed-agent-prompts.ts
 *
 * Source of truth for the templates: prisma/agent-prompts.ts.
 */
import { PrismaClient } from '@prisma/client'
import { AGENT_TEMPLATES } from '../prisma/agent-prompts'

const prisma = new PrismaClient()

async function main() {
  let created = 0
  let skipped = 0
  for (const template of AGENT_TEMPLATES) {
    const existing = await prisma.promptTemplate.findUnique({ where: { key: template.key } })
    if (existing) {
      skipped++
      console.log(`  = ${template.key} (exists, untouched)`)
      continue
    }
    await prisma.promptTemplate.create({ data: template })
    created++
    console.log(`  + ${template.key}: ${template.stepName}`)
  }
  console.log(`\nAgent prompts: ${created} created, ${skipped} already present.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
