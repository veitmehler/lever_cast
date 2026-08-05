/**
 * Targeted seeder for the Azavea vertical's prompt OVERRIDES.
 *
 * Upserts by (stepNumber, vertical:'azavea') with update: {} — admin edits
 * made via /admin/prompts?vertical=azavea survive re-seeding. To push updated
 * copy from the source file deliberately, run with FORCE=1.
 *
 * Run: set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/seed-azavea-prompts.ts
 */
import { PrismaClient } from '@prisma/client'
import { AZAVEA_PROMPT_OVERRIDES } from '../prisma/verticals/azavea-prompts'

const prisma = new PrismaClient()
const force = process.env.FORCE === '1'

async function main() {
  let created = 0
  let updated = 0
  let skipped = 0
  for (const t of AZAVEA_PROMPT_OVERRIDES) {
    const where = { stepNumber_vertical: { stepNumber: t.stepNumber, vertical: t.vertical } }
    const existing = await prisma.promptTemplate.findUnique({ where })
    if (existing && !force) {
      skipped++
      console.log(`  = azavea step ${t.stepNumber} (${t.stepName}) exists, untouched`)
      continue
    }
    if (existing) {
      await prisma.promptTemplate.update({
        where,
        data: { systemPrompt: t.systemPrompt, userPrompt: t.userPrompt, version: { increment: 1 } },
      })
      updated++
      console.log(`  ~ azavea step ${t.stepNumber} (${t.stepName}) FORCED update`)
    } else {
      await prisma.promptTemplate.create({ data: t })
      created++
      console.log(`  + azavea step ${t.stepNumber} (${t.stepName})`)
    }
  }
  console.log(`\nAzavea overrides: ${created} created, ${updated} force-updated, ${skipped} untouched.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
