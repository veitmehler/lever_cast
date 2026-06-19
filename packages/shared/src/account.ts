/**
 * Account (tenant) helpers shared by web + api.
 *
 * An Account groups up to 3 Users with equal permissions. Brand-level singletons
 * and all content are shared across an Account's members. These helpers are the
 * single source of truth for (a) creating a user together with its account and
 * (b) resolving the member set used to scope account-shared reads.
 *
 * No Clerk dependency here — callers pass the already-resolved email/name.
 */
import { prisma } from './prisma'
import type { User } from '@prisma/client'

/** Maximum number of users that can share one account. */
export const ACCOUNT_SEAT_LIMIT = 3

export interface UserIdentity {
  clerkId: string
  email: string
  name?: string | null
}

/** Create an Account owned by the given user and link the user to it. */
async function createAccountForUser(userId: string, name?: string | null): Promise<string> {
  const account = await prisma.account.create({
    data: { name: name ?? null, ownerUserId: userId },
  })
  await prisma.user.update({ where: { id: userId }, data: { accountId: account.id } })
  return account.id
}

/** Ensure a user has an account; backfills one if missing (older/invited rows). */
export async function ensureAccount(user: Pick<User, 'id' | 'accountId' | 'name'>): Promise<string> {
  if (user.accountId) return user.accountId
  return createAccountForUser(user.id, user.name)
}

/**
 * Find a user by clerkId, creating the user AND a fresh Account if they don't
 * exist yet. Always returns a user guaranteed to have an accountId.
 *
 * `accountIdForNewUser` lets an invite flow drop the new user into an existing
 * account instead of creating one (seat-cap enforcement is the caller's job).
 */
export async function getOrCreateUserWithAccount(
  identity: UserIdentity,
  accountIdForNewUser?: string,
): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { clerkId: identity.clerkId } })
  if (existing) {
    if (!existing.accountId) await ensureAccount(existing)
    return prisma.user.findUniqueOrThrow({ where: { id: existing.id } })
  }

  // Only honour an invite's target account if it still has a free seat;
  // otherwise the new user gets their own account.
  let joinAccountId: string | undefined
  if (accountIdForNewUser) {
    const seatsUsed = await prisma.user.count({ where: { accountId: accountIdForNewUser } })
    if (seatsUsed < ACCOUNT_SEAT_LIMIT) joinAccountId = accountIdForNewUser
  }

  const user = await prisma.user.create({
    data: {
      clerkId: identity.clerkId,
      email: identity.email,
      name: identity.name ?? identity.email.split('@')[0],
      ...(joinAccountId ? { accountId: joinAccountId } : {}),
    },
  })

  if (!joinAccountId) await createAccountForUser(user.id, user.name)

  return prisma.user.findUniqueOrThrow({ where: { id: user.id } })
}

export interface ResolvedAccount {
  userId: string // the current user's own id
  accountId: string
  ownerUserId: string // canonical user id that account-shared singletons are written under
  memberUserIds: string[] // all member ids (includes the current user)
}

/** Resolve the accountId for a given user id (null if the user/account is missing). */
export async function accountIdForUser(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { accountId: true } })
  return u?.accountId ?? null
}

/**
 * The canonical user id that an account's shared singletons (BrandSettings,
 * GhlSettings, newsletter routing) are written under — the account owner.
 * Falls back to the passed user id if there's no account/owner yet.
 */
export async function canonicalAccountUserId(userId: string): Promise<string> {
  const accountId = await accountIdForUser(userId)
  if (!accountId) return userId
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { ownerUserId: true },
  })
  return account?.ownerUserId ?? userId
}

/**
 * Read the account's BrandSettings for any member user id. Resolves via account
 * membership so all members share one brand profile. Returns the full row.
 */
export async function brandSettingsForUser(userId: string) {
  const accountId = await accountIdForUser(userId)
  return prisma.brandSettings.findFirst({
    where: accountId ? { user: { accountId } } : { userId },
  })
}

/** Read the account's GhlSettings for any member user id (shared across members). */
export async function ghlSettingsForUser(userId: string) {
  const accountId = await accountIdForUser(userId)
  return prisma.ghlSettings.findFirst({
    where: accountId ? { user: { accountId } } : { userId },
  })
}

/**
 * All member user ids for the account a given user belongs to (includes the
 * user). Use for JS-level ownership checks that can't go through the query
 * extension (e.g. `findUnique` by id then comparing `row.userId`).
 */
export async function accountMemberIdsForUser(userId: string): Promise<string[]> {
  const accountId = await accountIdForUser(userId)
  if (!accountId) return [userId]
  const ids = await accountMemberIds(accountId)
  return ids.length ? ids : [userId]
}

/** All member user ids for an account (small set, ≤3). */
export async function accountMemberIds(accountId: string): Promise<string[]> {
  const members = await prisma.user.findMany({
    where: { accountId },
    select: { id: true },
  })
  return members.map((m) => m.id)
}

/**
 * Resolve the account context for a clerkId: the current user's id, their
 * accountId, and the full member set used to scope account-shared reads.
 * Returns null if the user doesn't exist.
 */
export async function resolveAccountForClerkId(clerkId: string): Promise<ResolvedAccount | null> {
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, accountId: true, name: true },
  })
  if (!user) return null
  const accountId = user.accountId ?? (await ensureAccount(user))
  const [memberUserIds, account] = await Promise.all([
    accountMemberIds(accountId),
    prisma.account.findUnique({ where: { id: accountId }, select: { ownerUserId: true } }),
  ])
  return { userId: user.id, accountId, ownerUserId: account?.ownerUserId ?? user.id, memberUserIds }
}
