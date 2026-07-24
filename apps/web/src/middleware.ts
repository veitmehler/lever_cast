import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Canonical app host is env-driven (flips to chiro.omniply.io in the rename's
// Phase 3); BOTH omniply and legacy socioply hosts serve during the transition.
const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? 'chiro.omniply.io'
const APP_HOSTS = new Set([APP_HOST, 'chiro.omniply.io', 'staging.chiro.omniply.io', 'app.socioply.com'])
const WWW_HOST = 'www.socioply.com'

// Routes that belong exclusively to the authenticated app (not the marketing site)
const APP_PATHS = [
  '/dashboard',
  '/posts',
  '/workflow',
  '/images',
  '/calendar',
  '/account',
  '/settings',
  '/templates',
  '/sign-in',
  '/sign-up',
]

// Public routes on the app domain that don't require Clerk authentication
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/posts/publish-scheduled',
  '/api/posts/sync-analytics',
  // Embedded GHL surface: authenticated by the SSO-derived embed token, not
  // Clerk (onboarding plan Phase 0).
  '/embed(.*)',
])

function isOmniplyDomain(host: string) {
  return host === APP_HOST || host === WWW_HOST
}

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // ── Domain routing (production only — skipped on localhost / preview URLs) ──
  if (isOmniplyDomain(host)) {
    if (host === WWW_HOST) {
      // www only serves the marketing site. Any app path → redirect to app domain.
      const isAppPath = APP_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/'),
      )
      if (isAppPath) {
        const url = new URL(request.url)
        url.host = APP_HOST
        return NextResponse.redirect(url, 301)
      }
      // www serves marketing pages without Clerk auth enforcement
      return NextResponse.next()
    }

    if (APP_HOSTS.has(host)) {
      // app domain: root path → redirect to dashboard
      if (pathname === '/') {
        const url = new URL(request.url)
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  // ── Clerk auth protection (applies on app domain + localhost) ──
  // API routes are explicitly excluded: each handler calls auth() itself and
  // returns a JSON 401. Letting auth.protect() intercept /api/* would make
  // Clerk return an HTML error page on auth failures, causing SyntaxErrors on
  // the client and masking real 401s as confusing 404s.
  const isApiRoute = pathname.startsWith('/api/')
  if (!isPublicRoute(request) && !isApiRoute) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
