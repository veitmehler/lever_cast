// Valid platform names
export const VALID_PLATFORMS = ['linkedin', 'twitter', 'facebook', 'instagram', 'threads']

// OAuth configuration
export const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID
export const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET
export const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/linkedin/callback`

// LinkedIn Company Pages App (separate app for Community Management API)
export const LINKEDIN_COMPANY_CLIENT_ID = process.env.LINKEDIN_COMPANY_CLIENT_ID
export const LINKEDIN_COMPANY_CLIENT_SECRET = process.env.LINKEDIN_COMPANY_CLIENT_SECRET
// Note: Company callback uses same path but with ?target=company query param
export const LINKEDIN_COMPANY_REDIRECT_URI = process.env.LINKEDIN_COMPANY_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/linkedin/callback?target=company`

export const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID
export const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET
export const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/twitter/callback`

export const FACEBOOK_CLIENT_ID = process.env.FACEBOOK_CLIENT_ID
export const FACEBOOK_CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET
export const FACEBOOK_REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/facebook/callback`

export const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID
export const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || process.env.FACEBOOK_CLIENT_SECRET
export const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ||
  `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/social/instagram/callback`

// Threads requires its own Client ID and Secret (separate from Facebook)
// Threads OAuth REQUIRES HTTPS - cannot use HTTP even for localhost
export const THREADS_CLIENT_ID = process.env.THREADS_CLIENT_ID
export const THREADS_CLIENT_SECRET = process.env.THREADS_CLIENT_SECRET
// For local development, you must use an HTTPS URL (e.g., ngrok: https://your-domain.ngrok.io)
const getThreadsRedirectUri = () => {
  if (process.env.THREADS_REDIRECT_URI) {
    return process.env.THREADS_REDIRECT_URI
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  if (baseUrl.startsWith('https://')) {
    return `${baseUrl}/api/social/threads/callback`
  }
  return `${baseUrl}/api/social/threads/callback`
}
export const THREADS_REDIRECT_URI = getThreadsRedirectUri()
