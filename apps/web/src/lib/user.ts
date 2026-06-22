import { clerkClient } from '@clerk/nextjs/server'
import { getOrCreateUserWithAccount } from '@socioply/shared'
import type { User } from '@prisma/client'

/**
 * Canonical "find or create the DB user for a Clerk id" for web route handlers.
 *
 * Fetches the user's email/name from Clerk, then delegates to the shared
 * account-aware creator so every new user is created together with an Account
 * (tenant). Returns a User guaranteed to have an accountId.
 *
 * Prefer this over the ad-hoc per-route getOrCreateUser copies.
 */
export async function getOrCreateUser(clerkId: string): Promise<User> {
  const existingFast = await tryExisting(clerkId)
  if (existingFast) return existingFast

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkId)
  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress
  if (!email) throw new Error('No email found')

  const firstName = clerkUser.firstName || ''
  const lastName = clerkUser.lastName || ''
  const name = firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : email.split('@')[0]

  // Team membership is resolved by email roster inside getOrCreateUserWithAccount.
  return getOrCreateUserWithAccount({ clerkId, email, name })
}

/** Fast path: skip the Clerk round-trip when the user already exists. */
async function tryExisting(clerkId: string): Promise<User | null> {
  const { prisma, ensureAccount, ensureRosterMembership } = await import('@socioply/shared')
  const user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) return null
  if (!user.accountId) await ensureAccount(user)
  // Honor owner-added roster (teammates join their account on sign-in).
  await ensureRosterMembership({ id: user.id, email: user.email, accountId: user.accountId })
  return prisma.user.findUnique({ where: { id: user.id } })
}
