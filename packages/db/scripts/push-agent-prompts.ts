/**
 * DELIBERATE prompt push for chat-agent rows (contact-convergence batch and
 * future revisions): overwrites userPrompt of the listed keys on the
 * 'default' vertical from prisma/agent-prompts.ts.
 *
 * Unlike seed-agent-prompts.ts (create-only, admin-edit-safe), this REPLACES
 * the stored copy — run it only when the template file itself is the intended
 * source of truth for the change being shipped.
 *
 * Run: set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/push-agent-prompts.ts agent_system agent_user_frame
 */
import { PrismaClient } from '@prisma/client'
import { AGENT_TEMPLATES } from '../prisma/agent-prompts'

const prisma = new PrismaClient()

async function main() {
  const keys = process.argv.slice(2)
  if (!keys.length) {
    console.error('Usage: tsx scripts/push-agent-prompts.ts <key> [key...]')
    process.exit(1)
  }
  for (const key of keys) {
    const template = AGENT_TEMPLATES.find((t) => t.key === key)
    if (!template) {
      console.error(`  ! ${key}: not in AGENT_TEMPLATES — skipped`)
      continue
    }
    const result = await prisma.promptTemplate.updateMany({
      where: { key, vertical: 'default' },
      data: { userPrompt: template.userPrompt },
    })
    console.log(`  ~ ${key}: ${result.count} row(s) updated`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
