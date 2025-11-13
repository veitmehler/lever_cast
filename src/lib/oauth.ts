import { randomBytes } from 'crypto'

// In-memory store for OAuth state tokens
// In production, consider using Redis or database for distributed systems
type OAuthStateData = {
  clerkId: string
  platform: string
  expiresAt: Date
  codeVerifier?: string
  target?: 'personal' | 'company' // For LinkedIn: personal profile vs company page
}

const oauthStateStore = new Map<string, OAuthStateData>()

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = new Date()
  for (const [state, data] of oauthStateStore.entries()) {
    if (data.expiresAt < now) {
      oauthStateStore.delete(state)
    }
  }
}, 10 * 60 * 1000)

/**
 * Generate a secure OAuth state token
 */
export function generateOAuthState(
  clerkId: string, 
  platform: string, 
  target?: 'personal' | 'company'
): { state: string; codeVerifier: string } {
  const state = randomBytes(32).toString('hex')
  const codeVerifier = randomBytes(32).toString('base64url')

  oauthStateStore.set(state, {
    clerkId,
    platform,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
    codeVerifier,
    target,
  })
  return { state, codeVerifier }
}

/**
 * Verify and consume an OAuth state token
 */
export function verifyOAuthState(
  state: string,
  clerkId: string,
  platform: string
): { valid: true; codeVerifier?: string; target?: 'personal' | 'company' } | { valid: false } {
  const stored = oauthStateStore.get(state)
  if (!stored) {
    return { valid: false }
  }

  // Check expiration
  if (stored.expiresAt < new Date()) {
    oauthStateStore.delete(state)
    return { valid: false }
  }

  // Verify clerkId and platform match
  if (stored.clerkId !== clerkId || stored.platform !== platform) {
    return { valid: false }
  }

  // Consume the state (one-time use)
  const target = stored.target
  oauthStateStore.delete(state)
  return { valid: true, codeVerifier: stored.codeVerifier, target }
}

