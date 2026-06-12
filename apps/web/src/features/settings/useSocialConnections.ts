'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import type { SocialConnection, SocialPage } from './types'

// Owns the Connected Accounts state: OAuth connections, LinkedIn/Facebook page
// lists (with rate-limit cooldowns), post-target settings, and the OAuth
// callback toasts shown when returning from a provider redirect.
export function useSocialConnections() {
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState<Record<string, boolean>>({})
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({})
  const [availablePages, setAvailablePages] = useState<Record<string, SocialPage[]>>({})
  const [isLoadingPages, setIsLoadingPages] = useState<Record<string, boolean>>({})
  const [rateLimitUntil, setRateLimitUntil] = useState<Record<string, number | null>>({})
  const [postTargetTypes, setPostTargetTypes] = useState<Record<string, 'personal' | 'page'>>({})
  const pagesFetchedRef = useRef<Set<string>>(new Set())
  const [selectedPageIds, setSelectedPageIds] = useState<Record<string, string>>({})
  const [isRefreshingUsername, setIsRefreshingUsername] = useState<Record<string, boolean>>({})

  // Track loading state with ref to avoid dependency issues
  const isLoadingPagesRef = useRef<Set<string>>(new Set())
  // Store pages in ref so we can access latest value without dependency issues
  const availablePagesRef = useRef<Record<string, SocialPage[]>>({})
  // Track rate limit cooldowns (platform -> timestamp when we can retry)
  const rateLimitCooldownRef = useRef<Record<string, number>>({})

  // Update ref whenever state changes
  useEffect(() => {
    availablePagesRef.current = availablePages
  }, [availablePages])

  // Fetch pages for a platform
  // Using useCallback with empty deps and refs to break dependency cycle
  const fetchPages = useCallback(async (platform: string, forceRefresh = false): Promise<SocialPage[]> => {
    if (platform !== 'linkedin' && platform !== 'facebook') return []

    // Prevent duplicate calls: if already loading (unless force refresh)
    if (!forceRefresh && isLoadingPagesRef.current.has(platform)) {
      // Return current pages from ref (always up-to-date)
      return availablePagesRef.current[platform] || []
    }

    // Check rate limit cooldown
    const cooldownEnd = rateLimitCooldownRef.current[platform]
    if (!forceRefresh && cooldownEnd && Date.now() < cooldownEnd) {
      console.log(`[Settings] Rate limit cooldown active for ${platform}, skipping fetch`)
      return availablePagesRef.current[platform] || []
    }

    // Only skip if already fetched AND we have pages (not if fetch failed)
    if (!forceRefresh && pagesFetchedRef.current.has(platform)) {
      const cachedPages = availablePagesRef.current[platform] || []
      // If we have cached pages, return them
      if (cachedPages.length > 0) {
        return cachedPages
      }
      // If cached pages are empty but not due to rate limit, allow retry
      // (Rate limit cooldown check above will prevent immediate retry)
    }

    try {
      isLoadingPagesRef.current.add(platform)
      setIsLoadingPages(prev => ({ ...prev, [platform]: true }))
      const response = await fetch(`/api/social/${platform}/pages`)
      if (response.ok) {
        const data = await response.json() as { pages: SocialPage[]; rateLimit?: boolean }
        const pages = data.pages || []

        // If rate limit, set cooldown (5 minutes)
        if (data.rateLimit) {
          console.warn(`[Settings] Rate limit detected for ${platform}, setting 5-minute cooldown`)
          const cooldownEndTime = Date.now() + 5 * 60 * 1000 // 5 minutes
          rateLimitCooldownRef.current[platform] = cooldownEndTime
          setRateLimitUntil(prev => ({ ...prev, [platform]: cooldownEndTime }))
          // Still mark as fetched to prevent immediate retries
          pagesFetchedRef.current.add(platform)
        } else {
          // Clear cooldown if we got a successful response
          delete rateLimitCooldownRef.current[platform]
          setRateLimitUntil(prev => {
            if (!prev[platform]) return prev
            const updated = { ...prev }
            delete updated[platform]
            return updated
          })
          // Mark as fetched if API call succeeded (even if pages array is empty)
          pagesFetchedRef.current.add(platform)
        }

        setAvailablePages(prev => ({ ...prev, [platform]: pages }))
        // Update ref immediately
        availablePagesRef.current[platform] = pages
        return pages
      } else {
        let errorData: { error?: string; rateLimit?: boolean; retryAfterMs?: number } | null = null
        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        const isRateLimitError = response.status === 429 || errorData?.rateLimit
        const retryAfterMs = errorData?.retryAfterMs || 5 * 60 * 1000

        if (isRateLimitError) {
          console.warn(`[Settings] ${platform} pages rate limited. Pausing new requests for ${(retryAfterMs / 60000).toFixed(1)} minutes.`)
          const cooldownEndTime = Date.now() + retryAfterMs
          rateLimitCooldownRef.current[platform] = cooldownEndTime
          setRateLimitUntil(prev => ({ ...prev, [platform]: cooldownEndTime }))
          pagesFetchedRef.current.add(platform) // Prevent immediate retries
          toast.warning('Facebook API rate limit reached. Please wait a few minutes before trying again.', {
            duration: 12000,
          })
        } else {
          // Ensure cooldown cleared so future retries are allowed
          delete rateLimitCooldownRef.current[platform]
          setRateLimitUntil(prev => {
            if (!prev[platform]) return prev
            const updated = { ...prev }
            delete updated[platform]
            return updated
          })
          pagesFetchedRef.current.delete(platform)
          const errorMessage = errorData?.error || `Failed to fetch ${platform} pages (${response.status})`
          toast.error(errorMessage)
        }

        setAvailablePages(prev => ({ ...prev, [platform]: [] }))
        availablePagesRef.current[platform] = []
        return []
      }
    } catch (error) {
      console.error(`Error fetching ${platform} pages:`, error)
      setAvailablePages(prev => ({ ...prev, [platform]: [] }))
      availablePagesRef.current[platform] = []
      delete rateLimitCooldownRef.current[platform]
      setRateLimitUntil(prev => {
        if (!prev[platform]) return prev
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
      // Don't mark as fetched if there was an error, so we can retry
      pagesFetchedRef.current.delete(platform)
      return []
    } finally {
      isLoadingPagesRef.current.delete(platform)
      setIsLoadingPages(prev => ({ ...prev, [platform]: false }))
    }
  }, []) // Empty deps - use refs to access latest state without causing re-renders

  // Update post target settings
  const updatePostTargetSettings = async (platform: string, postTargetType: 'personal' | 'page', selectedPageId?: string) => {
    try {
      const response = await fetch(`/api/social/${platform}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postTargetType,
          selectedPageId: postTargetType === 'page' ? selectedPageId : null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update local state
        setSocialConnections(prev => prev.map(c =>
          c.platform === platform && c.isActive
            ? { ...c, postTargetType: data.connection.postTargetType, selectedPageId: data.connection.selectedPageId }
            : c
        ))
        toast.success(`${platform === 'linkedin' ? 'LinkedIn' : 'Facebook'} posting target updated`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error(`Error updating ${platform} settings:`, error)
      toast.error('Failed to update settings')
    }
  }

  // Fetch social connections on mount
  // Using useCallback with fetchPages as dependency since we call it inside
  const fetchConnections = useCallback(async () => {
    try {
      setIsLoadingConnections(true)
      const response = await fetch('/api/social/connections')
      if (response.ok) {
        const connections: SocialConnection[] = await response.json()
        setSocialConnections(connections)

        // Initialize postTargetTypes and selectedPageIds from connections
        const targetTypes: Record<string, 'personal' | 'page'> = {}
        const pageIds: Record<string, string> = {}
        connections.forEach(conn => {
          if (conn.isActive && (conn.platform === 'linkedin' || conn.platform === 'facebook')) {
            targetTypes[conn.platform] = conn.postTargetType || 'personal'
            if (conn.selectedPageId) {
              pageIds[conn.platform] = conn.selectedPageId
            }
            // Fetch pages if connected - fetchPages has internal guards to prevent duplicates
            if (conn.platform === 'linkedin' || conn.platform === 'facebook') {
              // Call fetchPages directly - it's stable (empty deps) and has internal deduplication
              fetchPages(conn.platform, false).catch(err => {
                console.error(`Error fetching pages for ${conn.platform}:`, err)
              })
            }
          }
        })
        setPostTargetTypes(targetTypes)
        setSelectedPageIds(pageIds)
      }
    } catch (error) {
      console.error('Error fetching social connections:', error)
    } finally {
      setIsLoadingConnections(false)
    }
  }, [fetchPages]) // fetchPages is stable (empty deps), so this is safe

  // Check for OAuth callback messages in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      toast.success('Account connected successfully!')
      // Refresh connections list
      fetchConnections()
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        'oauth_not_configured': 'OAuth not configured. Please check environment variables.',
        'invalid_state': 'Invalid OAuth state. Please try again.',
        'token_exchange_failed': 'Failed to exchange authorization code. Please try again.',
        'profile_fetch_failed': 'Failed to fetch profile. Please try again.',
        'unauthorized_scope_error': 'LinkedIn app needs "Share on LinkedIn" product approval. See instructions below.',
        'w_organization_social_not_approved': 'LinkedIn Company Pages are not available. You can still connect and post to your personal profile.',
        'rate_limit': 'Twitter rate limit reached. Please wait 15 minutes before trying again.',
        'no_instagram_account': 'No Instagram Business account found linked to your Facebook Page. Please ensure your Instagram account is a Business or Creator account and is linked to your Facebook Page in Business Manager.',
        'instagram_permission_required': 'Instagram connection requires App Review. The app needs "instagram_content_publish" permission approved through Meta App Review. Please complete App Review in your Meta App Dashboard before connecting Instagram.',
        'page_token_missing': 'Failed to get Page access token. Please try reconnecting.',
      }

      // Check if error message contains rate limit indicators
      const decodedError = decodeURIComponent(error)
      const isRateLimit = decodedError.toLowerCase().includes('rate') ||
                         decodedError.toLowerCase().includes('429') ||
                         decodedError.toLowerCase().includes('too many requests')

      // Get custom message from URL if available
      const messageParam = searchParams.get('message')
      const customMessage = messageParam ? decodeURIComponent(messageParam) : null

      const errorMsg = customMessage || (isRateLimit
        ? 'Twitter rate limit reached. Please wait 15 minutes before trying to connect again.'
        : errorMessages[error] || `Connection failed: ${decodedError}`)

      // Show warning for w_organization_social (not a blocking error)
      if (error === 'w_organization_social_not_approved') {
        toast.warning(errorMsg, {
          duration: 10000,
        })
      } else {
        toast.error(errorMsg, {
          duration: 15000, // Show longer for important errors
        })
      }

      // Show detailed message for scope errors
      if (error === 'unauthorized_scope_error') {
        console.error('LinkedIn Scope Error:', 'Your LinkedIn app needs to request access to "Share on LinkedIn" product.')
        console.error('Steps:')
        console.error('1. Go to https://www.linkedin.com/developers/')
        console.error('2. Select your app')
        console.error('3. Go to "Products" tab')
        console.error('4. Request access to "Share on LinkedIn"')
        console.error('5. Wait for approval (can take a few days)')
      }

      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }
  }, [fetchConnections])

  // Fetch social connections on mount
  useEffect(() => {
    fetchConnections()
  }, [fetchConnections]) // fetchConnections is stable (memoized with useCallback), so it won't change

  return {
    socialConnections, setSocialConnections,
    isLoadingConnections,
    isDisconnecting, setIsDisconnecting,
    isConnecting, setIsConnecting,
    availablePages,
    isLoadingPages,
    rateLimitUntil,
    postTargetTypes, setPostTargetTypes,
    selectedPageIds, setSelectedPageIds,
    isRefreshingUsername, setIsRefreshingUsername,
    fetchPages,
    fetchConnections,
    updatePostTargetSettings,
  }
}

export type SocialConnectionsData = ReturnType<typeof useSocialConnections>
