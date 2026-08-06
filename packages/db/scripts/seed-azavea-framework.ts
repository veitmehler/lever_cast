/**
 * Azavea belief-arc outline framework (#90) — Problem → Solution → New Problem.
 *
 * isActive: FALSE by design: the LLM auto-assigner only selects from active
 * frameworks, so this can never leak into clinic patient articles; the
 * variable-resolver loads pinned frameworks by number regardless of isActive,
 * so Azavea calendar topics that pin number 90 use it normally.
 *
 * Run: set -a; . ./.env; set +a; pnpm --filter @omniply/db exec tsx scripts/seed-azavea-framework.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const FRAMEWORK = {
  number: 90,
  label: 'Belief Arc — Problem / Solution / New Problem (Azavea B2B)',
  description:
    'INTERNAL — Azavea vertical only. Never auto-assign to patient content. ' +
    'Lead-gen education arc: intensify a business problem, teach the systematic solution as a belief shift, ' +
    'then surface the hidden cost of executing it manually.',
  body: `STRUCTURE THIS ARTICLE AS A THREE-ACT BELIEF ARC:

ACT 1 — THE PROBLEM (intensify before explaining):
- Open on a concrete moment from the reader's practice, then name the problem as a mechanism.
- Show the math of the damage with realistic practice numbers. Make the invisible cost visible.
- Explain why the obvious fixes fail. Spend real space here: the reader has already tried the obvious fix.

ACT 2 — THE SOLUTION (teach the system, sell the belief — never the checklist):
- Present the systematic approach that actually solves the problem: consistent content presence, fast response, review momentum, and steady patient communication working together as one system.
- Teach WHY the system works — the mechanism, the compounding, the flywheel. Build genuine understanding and belief.
- Do NOT provide step-by-step DIY instructions, scripts, templates, or "do this this week" checklists. The reader should finish understanding WHAT the right system is and WHY it works — not holding a to-do list.

ACT 3 — THE NEW PROBLEM (the execution wall):
- Now surface what running that system actually takes: the honest hours per week, the consistency it demands over months, the skills involved.
- Address the tempting shortcut: generic AI tools (ChatGPT and the like) can draft content, but their output is non-deterministic, still consumes the owner's time to prompt, review and publish — and nothing in them ensures compliance with health-advertising regulations. They will happily write claims a practice is not allowed to make, and the practice owns that liability.
- Close on the reader's own conclusion: the system is right, and it is a job — one that runs best when it is operated for you. Do not pitch; let the arithmetic and the reader's own time-scarcity make the point. End on a short, compressed line.`,
  isActive: false,
}

async function main() {
  await prisma.outlineFramework.upsert({
    where: { number: FRAMEWORK.number },
    create: FRAMEWORK,
    update: { label: FRAMEWORK.label, description: FRAMEWORK.description, body: FRAMEWORK.body, isActive: false },
  })
  console.log(`Framework #${FRAMEWORK.number} upserted (isActive: false).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
