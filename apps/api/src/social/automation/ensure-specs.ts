import { prisma } from '@socioply/shared'
import { DEFAULT_SOCIAL_POST_SPECS } from './default-specs'

/** Seed the 12 default slot configs for a user (idempotent). */
export async function ensureDefaultSocialPostSpecs(userId: string): Promise<void> {
  const existing = await prisma.socialPostSpec.count({ where: { userId } })
  if (existing >= DEFAULT_SOCIAL_POST_SPECS.length) return

  for (const spec of DEFAULT_SOCIAL_POST_SPECS) {
    await prisma.socialPostSpec.upsert({
      where: { userId_slotKey: { userId, slotKey: spec.slotKey } },
      create: { userId, ...spec },
      update: {},
    })
  }
}
