import { prisma } from '../lib/prisma'

/** Returns all primary keywords already used in the user's site pages (for exclusion). */
export async function getGlobalExcludedKeywords(userId: string): Promise<string> {
  const pages = await prisma.sitePage.findMany({
    where: { userId, primaryKeyword: { not: null } },
    select: { primaryKeyword: true },
  })
  return pages
    .map((p) => p.primaryKeyword?.toLowerCase().trim())
    .filter(Boolean)
    .join(', ')
}

/** Returns true if the keyword does not already exist in any SitePage for this user. */
export async function validatePrimaryKeywordUniqueness(
  keyword: string,
  userId: string,
  currentJobId: string,
): Promise<{ isUnique: boolean; conflict?: string }> {
  const normalised = keyword.toLowerCase().trim()
  const existing = await prisma.sitePage.findFirst({
    where: {
      userId,
      primaryKeyword: { equals: normalised, mode: 'insensitive' },
      // Allow the page created for this very job (partial SitePage created in a previous attempt)
      NOT: { jobId: currentJobId },
    },
    select: { primaryKeyword: true, jobId: true },
  })

  if (existing) {
    return { isUnique: false, conflict: existing.primaryKeyword ?? undefined }
  }
  return { isUnique: true }
}

export class DuplicateKeywordError extends Error {
  keyword: string
  constructor(keyword: string) {
    super(`Primary keyword "${keyword}" already exists after 3 attempts`)
    this.name = 'DuplicateKeywordError'
    this.keyword = keyword
  }
}
