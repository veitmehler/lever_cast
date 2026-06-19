import { PrismaClient } from '@prisma/client'

// One client definition for both runtimes:
// - api/worker (long-running process): the module loads once, so this is
//   effectively a singleton.
// - web (Next.js): the globalThis cache prevents dev hot-reload from stacking
//   clients; in production each serverless invocation gets a fresh client.
const globalForPrisma = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

const base =
  globalForPrisma.prismaBase ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaBase = base

// ── Account-scoped content visibility ────────────────────────────────────────
//
// Content is shared across the (up to 3) members of an Account. Rather than
// editing every userId-scoped query by hand, a client extension rewrites
// `where.userId = <id>` into `where.userId IN <account member ids>` for the
// content models below. Brand-level singletons (BrandSettings/GhlSettings/
// Settings) are intentionally NOT scoped here — they are resolved explicitly via
// the account owner (see account.ts). Writes are untouched: `create`/`update`/
// `delete`/`upsert` keep their `data.userId` (the creator) and unique selectors.
//
// Behaviorally a no-op for single-member accounts (members === [self]); it only
// broadens visibility once a second member joins.
const ACCOUNT_SCOPED_MODELS = new Set([
  'Draft',
  'Post',
  'ApiKey',
  'Template',
  'SocialConnection',
  'TwitterApiRequest',
  'Topic',
  'ArticleJob',
  'LLMUsage',
  'WordPressConnection',
  'ErrorLog',
  'Media',
  'SectionEnrichment',
  'SocialAutomationRun',
  'SocialPostSpec',
  'Newsletter',
  'NewsletterOffer',
])

const SCOPED_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
])

// Short-TTL memo so a burst of content queries doesn't re-fetch the member set.
const memberCache = new Map<string, { ids: string[]; exp: number }>()

async function membersOf(userId: string): Promise<string[]> {
  const now = Date.now()
  const hit = memberCache.get(userId)
  if (hit && hit.exp > now) return hit.ids

  const u = await base.user.findUnique({ where: { id: userId }, select: { accountId: true } })
  let ids: string[]
  if (!u?.accountId) {
    ids = [userId]
  } else {
    const members = await base.user.findMany({
      where: { accountId: u.accountId },
      select: { id: true },
    })
    ids = members.length ? members.map((m) => m.id) : [userId]
  }
  memberCache.set(userId, { ids, exp: now + 10_000 })
  return ids
}

export const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        if (ACCOUNT_SCOPED_MODELS.has(model) && SCOPED_OPS.has(operation)) {
          const a = args as { where?: Record<string, unknown> } | undefined
          const where = a?.where
          if (where && typeof where.userId === 'string') {
            return query({
              ...(a as object),
              where: { ...where, userId: { in: await membersOf(where.userId) } },
            } as typeof args)
          }
        }
        return query(args)
      },
    },
  },
})
