/**
 * Vertical-aware prompt resolution (.plans/vertical-platform.implementation-plan.md V0).
 *
 * The single lookup path for every PromptTemplate read at generation time:
 *   1. exact (key|stepNumber, vertical) row, isActive — the vertical override
 *   2. else the (key|stepNumber, 'default') row — the base (chiro-tuned) set
 *
 * Verticals therefore INHERIT the default set and override only where their
 * copy differs. An inactive override is treated as absent (falls back), so
 * deactivating an override reverts the vertical to the default — it never
 * silently disables a step.
 *
 * Call sites pass whatever context they naturally hold: an explicit vertical
 * (agent engine holds the account) or a userId (pipelines, social
 * generators) — the resolver maps userId → account.vertical with a short
 * cache. No context at all resolves to 'default', which is exactly the
 * pre-vertical behavior.
 */
import { prisma } from '@omniply/shared'
import type { PromptTemplate } from '@prisma/client'

export const DEFAULT_VERTICAL = 'default'

const verticalCache = new Map<string, { vertical: string; expires: number }>()
const VERTICAL_TTL_MS = 15 * 60 * 1000

export interface ResolveOpts {
  userId?: string | null
  vertical?: string | null
}

/** Account vertical for a user ('default' when unknown — the safe identity). */
export async function verticalForUser(userId: string | null | undefined): Promise<string> {
  if (!userId) return DEFAULT_VERTICAL
  const hit = verticalCache.get(userId)
  if (hit && hit.expires > Date.now()) return hit.vertical
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { account: { select: { vertical: true } } },
  })
  const vertical = user?.account?.vertical ?? DEFAULT_VERTICAL
  verticalCache.set(userId, { vertical, expires: Date.now() + VERTICAL_TTL_MS })
  if (verticalCache.size > 2000) {
    const oldest = verticalCache.keys().next().value
    if (oldest) verticalCache.delete(oldest)
  }
  return vertical
}

async function effectiveVertical(opts?: ResolveOpts): Promise<string> {
  if (opts?.vertical) return opts.vertical
  return verticalForUser(opts?.userId)
}

/** Resolve a prompt by string key (nl_*, agent_*, …) with vertical fallback. */
export async function resolvePromptByKey(key: string, opts?: ResolveOpts): Promise<PromptTemplate | null> {
  const vertical = await effectiveVertical(opts)
  if (vertical !== DEFAULT_VERTICAL) {
    const override = await prisma.promptTemplate.findUnique({
      where: { key_vertical: { key, vertical } },
    })
    if (override?.isActive) return override
  }
  return prisma.promptTemplate.findUnique({ where: { key_vertical: { key, vertical: DEFAULT_VERTICAL } } })
}

/** Resolve a prompt by pipeline stepNumber with vertical fallback. */
export async function resolvePromptByStep(stepNumber: number, opts?: ResolveOpts): Promise<PromptTemplate | null> {
  const vertical = await effectiveVertical(opts)
  if (vertical !== DEFAULT_VERTICAL) {
    const override = await prisma.promptTemplate.findUnique({
      where: { stepNumber_vertical: { stepNumber, vertical } },
    })
    if (override?.isActive) return override
  }
  return prisma.promptTemplate.findUnique({
    where: { stepNumber_vertical: { stepNumber, vertical: DEFAULT_VERTICAL } },
  })
}

/** Test/ops hook. */
export function clearVerticalCache(): void {
  verticalCache.clear()
}
