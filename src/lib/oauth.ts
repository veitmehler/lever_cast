import { randomBytes } from 'crypto'

// In-memory store for OAuth state tokens
// In production, consider using Redis or database for distributed systems
const oauthStateStore = new Map<string, { clerkId: string; platform: string; expiresAt: Date }>()

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
export function generateOAuthState(clerkId: string, platform: string): string {
  const state = randomBytes(32).toString('hex')
  oauthStateStore.set(state, {
    clerkId,
    platform,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
  })
  return state
}

/**
 * Verify and consume an OAuth state token
 */
export function verifyOAuthState(state: string, clerkId: string, platform: string): boolean {
  const stored = oauthStateStore.get(state)
  if (!stored) {
    return false
  }
  
  // Check expiration
  if (stored.expiresAt < new Date()) {
    oauthStateStore.delete(state)
    return false
  }
  
  // Verify clerkId and platform match
  if (stored.clerkId !== clerkId || stored.platform !== platform) {
    return false
  }
  
  // Consume the state (one-time use)
  oauthStateStore.delete(state)
  return true
}

