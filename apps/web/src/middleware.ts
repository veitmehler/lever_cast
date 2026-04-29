import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const APP_HOST = 'app.socioply.com'
const WWW_HOST = 'www.socioply.com'

// Routes that belong exclusively to the authenticated app (not the marketing site)
const APP_PATHS = [
  '/dashboard',
  '/posts',
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
])

function isSocioplyDomain(host: string) {
  return host === APP_HOST || host === WWW_HOST
}

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // ── Domain routing (production only — skipped on localhost / preview URLs) ──
  if (isSocioplyDomain(host)) {
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

    if (host === APP_HOST) {
      // app domain: root path → redirect to dashboard
      if (pathname === '/') {
        const url = new URL(request.url)
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  // ── Clerk auth protection (applies on app domain + localhost) ──
  if (!isPublicRoute(request)) {
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
