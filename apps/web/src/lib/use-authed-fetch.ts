'use client'

import { useAuth } from '@clerk/nextjs'
import { useCallback } from 'react'

/**
 * Client-side authenticated fetch.
 *
 * Why this exists: on long-lived pages (e.g. the workflow detail page) the
 * browser tab is often backgrounded for minutes while an article generates and
 * enriches. Browsers aggressively throttle timers in background tabs, which
 * stalls Clerk's automatic cookie/session-token refresh. The session itself is
 * still valid (you're not logged out), but the short-lived (~60s) session token
 * in the `__session` cookie goes stale. Because Clerk's recovery "handshake"
 * only runs on top-level document navigations (never on `fetch`/`EventSource`),
 * every cookie-only API call then 401s until a full page reload.
 *
 * The fix: mint the token on the client with `useAuth().getToken()` (which
 * refreshes on demand) and attach it as an `Authorization: Bearer` header. The
 * proxy forwards it to the DO API, which verifies it. On a 401/403 we force a
 * cache-skipping refresh and retry once, so a single stale-token blip recovers
 * transparently instead of freezing the page.
 */
export function useAuthedFetch() {
  const { getToken } = useAuth()

  /** Get a fresh Clerk session token, optionally bypassing the SDK cache. */
  const getFreshToken = useCallback(
    async (opts?: { skipCache?: boolean }): Promise<string | null> => {
      try {
        return await getToken(opts)
      } catch {
        return null
      }
    },
    [getToken],
  )

  const authedFetch = useCallback(
    async (input: string, init: RequestInit = {}): Promise<Response> => {
      const doFetch = async (token: string | null): Promise<Response> => {
        const headers = new Headers(init.headers)
        if (token) headers.set('Authorization', `Bearer ${token}`)
        return fetch(input, { ...init, headers })
      }

      let res = await doFetch(await getFreshToken())

      // One forced-refresh retry on an auth failure. This handles the case
      // where the cached token expired between mint and request.
      if (res.status === 401 || res.status === 403) {
        const fresh = await getFreshToken({ skipCache: true })
        if (fresh) res = await doFetch(fresh)
      }

      return res
    },
    [getFreshToken],
  )

  return { authedFetch, getFreshToken }
}
