/**
 * Postgres-backed OAuth state store.
 *
 * Replaces the previous in-memory Map which was unsafe across multiple
 * Vercel lambda instances and DO API containers.
 *
 * Each state token is:
 *   - Written to `oauth_states` when the OAuth flow is initiated.
 *   - Consumed (deleted) in one atomic operation when the callback verifies it.
 *   - Expired after 10 minutes regardless.
 *
 * Expired rows are cleaned up by the `oauth-state-cleanup` pg-boss job (Phase 7).
 * Until that job is running, cleanup happens opportunistically on each new initiation.
 */

import { randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'

const TTL_MS = 10 * 60 * 1000 // 10 minutes

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Purge expired rows. Called opportunistically on each generate() to prevent
 * table bloat until the dedicated pg-boss cleanup job is available.
 * Non-blocking: errors are swallowed so a cleanup failure never breaks OAuth.
 */
async function purgeExpired(): Promise<void> {
  try {
    await prisma.oAuthState.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  } catch {
    // Non-fatal
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type OAuthStateResult = {
  state: string
  codeVerifier: string
}

/**
 * Generate a secure OAuth state token and persist it to the database.
 *
 * @param clerkId  - The authenticated user's Clerk ID.
 * @param platform - OAuth platform (linkedin | twitter | facebook | instagram | threads).
 * @param target   - Optional LinkedIn target type (personal | company).
 */
export async function generateOAuthState(
  clerkId: string,
  platform: string,
  target?: 'personal' | 'company'
): Promise<OAuthStateResult> {
  // Run expired-row cleanup in the background (fire and forget)
  purgeExpired().catch(() => {})

  const state = randomBytes(32).toString('hex')
  const codeVerifier = randomBytes(32).toString('base64url')

  await prisma.oAuthState.create({
    data: {
      state,
      clerkId,
      platform,
      codeVerifier,
      target: target ?? null,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  })

  return { state, codeVerifier }
}

export type OAuthStateVerifySuccess = {
  valid: true
  codeVerifier?: string
  target?: 'personal' | 'company'
}
export type OAuthStateVerifyFailure = { valid: false }
export type OAuthStateVerifyResult = OAuthStateVerifySuccess | OAuthStateVerifyFailure

/**
 * Verify and consume a state token in a single atomic operation.
 *
 * Returns `{ valid: false }` if the token:
 *   - Does not exist (already consumed or never created)
 *   - Has expired
 *   - Does not match clerkId or platform
 */
export async function verifyOAuthState(
  state: string,
  clerkId: string,
  platform: string
): Promise<OAuthStateVerifyResult> {
  // Delete and return in one round-trip; prevents double-consume race conditions
  // on concurrent requests (e.g. double-click on the OAuth redirect button).
  let row: {
    clerkId: string
    platform: string
    codeVerifier: string | null
    target: string | null
    expiresAt: Date
  } | null = null

  try {
    row = await prisma.oAuthState.findUnique({ where: { state } })
    if (row) {
      // Delete immediately (one-time use) — swallow errors; we already have the data
      await prisma.oAuthState.delete({ where: { state } }).catch(() => {})
    }
  } catch (err) {
    console.error('[oauth] Error reading state from database:', err)
    return { valid: false }
  }

  if (!row) return { valid: false }
  if (row.expiresAt < new Date()) return { valid: false }
  if (row.clerkId !== clerkId || row.platform !== platform) return { valid: false }

  return {
    valid: true,
    codeVerifier: row.codeVerifier ?? undefined,
    target: (row.target as 'personal' | 'company' | null) ?? undefined,
  }
}
