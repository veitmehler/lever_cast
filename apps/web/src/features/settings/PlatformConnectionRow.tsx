'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { SocialConnectionsData } from './useSocialConnections'

// One OAuth platform row in Connected Accounts: connect/disconnect buttons,
// the LinkedIn personal/company split, the Instagram username refresh, and
// the LinkedIn/Facebook post-target (personal vs. page) selector.
export function PlatformConnectionRow({ platform, social }: { platform: string; social: SocialConnectionsData }) {
  const {
    socialConnections, setSocialConnections,
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
  } = social

  const usesGhl = platform === 'linkedin' || platform === 'facebook' || platform === 'instagram' || platform === 'threads'
  // For LinkedIn, check for both personal and company connections
  // For other platforms, find the single connection
  let connection: typeof socialConnections[0] | undefined
  if (platform === 'linkedin') {
    // Prefer company connection if available, otherwise personal
    connection = socialConnections.find(c =>
      c.platform === platform &&
      c.isActive &&
      (c.appType === 'company' || c.appType === 'personal')
    )
  } else {
    connection = socialConnections.find(c => c.platform === platform && c.isActive)
  }
  const isConnected = !!connection
  const isDisconnectingPlatform = isDisconnecting[platform] || false

  const handleConnect = async (target: 'personal' | 'company' = 'personal') => {
    // For LinkedIn, create a unique key for personal vs company
    const connectionKey = platform === 'linkedin' ? `${platform}-${target}` : platform

    // Prevent multiple rapid clicks
    if (isConnecting[connectionKey] || isConnecting[platform]) {
      return
    }

    try {
      // Set connecting state for both the specific key and platform (for backward compatibility)
      setIsConnecting(prev => ({ ...prev, [connectionKey]: true, [platform]: true }))

      // For LinkedIn, pass target parameter to select the correct app
      const url = platform === 'linkedin' && target === 'company'
        ? `/api/social/${platform}?target=company`
        : `/api/social/${platform}`
      const response = await fetch(url, {
        method: 'POST',
      })
      const data = await response.json()

      if (response.ok) {
        if (data.redirectUrl) {
          // Redirect to OAuth URL
          window.location.href = data.redirectUrl
        } else {
          toast.error('OAuth flow not configured. Please check server logs.')
          setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
        }
      } else {
        // Show the actual error from the API
        console.error(`OAuth error for ${platform}:`, data)
        const errorMsg = data.error || `Failed to connect ${platform}. Please check that OAuth credentials are configured.`

        // Check for rate limit errors
        if (errorMsg.toLowerCase().includes('rate') || errorMsg.toLowerCase().includes('429')) {
          toast.error('Twitter rate limit reached. Please wait 15 minutes before trying again.', {
            duration: 15000,
          })
        } else {
          toast.error(errorMsg)
        }
        setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      toast.error(`Failed to connect ${platform}. Check console for details.`)
      setIsConnecting(prev => ({ ...prev, [connectionKey]: false, [platform]: false }))
    }
  }

  const handleDisconnect = async () => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return
    }

    try {
      setIsDisconnecting(prev => ({ ...prev, [platform]: true }))
      const response = await fetch(`/api/social/${platform}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setSocialConnections(prev => prev.filter(c => !(c.platform === platform && c.isActive)))
        toast.success(`${platform} disconnected successfully`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to disconnect')
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      toast.error('Failed to disconnect')
    } finally {
      setIsDisconnecting(prev => ({ ...prev, [platform]: false }))
    }
  }

  const platformConfig = {
    linkedin: { bg: '#0A66C2', icon: 'in', name: 'LinkedIn' },
    twitter: { bg: '#1DA1F2', icon: '𝕏', name: 'Twitter / X' },
    facebook: { bg: '#1877F2', icon: 'f', name: 'Facebook' },
    instagram: { bg: '#E4405F', icon: '📷', name: 'Instagram' },
    threads: { bg: '#000000', icon: '🧵', name: 'Threads' },
    telegram: { bg: '#24A1DE', icon: '✈️', name: 'Telegram' },
  }[platform] ?? {
    bg: '#6B7280',
    icon: platform.slice(0, 1).toUpperCase(),
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
  }

  const showPageSelector = isConnected && (platform === 'linkedin' || platform === 'facebook')
  const currentPostTargetType = postTargetTypes[platform] || connection?.postTargetType || 'personal'
  const currentSelectedPageId = selectedPageIds[platform] || connection?.selectedPageId || ''
  const pages = availablePages[platform] || []
  const isLoadingPagesForPlatform = isLoadingPages[platform] || false
  const rateLimitEndTime = rateLimitUntil[platform] || null
  const rateLimitRemainingMs = rateLimitEndTime ? Math.max(rateLimitEndTime - Date.now(), 0) : 0
  const rateLimitActive = rateLimitRemainingMs > 0

  return (
    <div key={platform} className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold`}
            style={platform === 'instagram' || platform === 'threads'
              ? { background: platform === 'instagram'
                  ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                  : 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)' }
              : { backgroundColor: platformConfig.bg }
            }>
            {platformConfig.icon}
          </div>
          <div>
            <div className="font-medium text-card-foreground">
              {platformConfig.name}
            </div>
            {isConnected ? (
              <div className="text-xs text-primary">
                {usesGhl ? 'Publishing via Omniply' : 'Connected'}
                {!usesGhl && connection?.platformUsername ? ` as ${connection.platformUsername}` : ''}
                {!usesGhl && connection?.lastUsed && (
                  <span className="text-muted-foreground ml-1">
                    • Last used {new Date(connection.lastUsed).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : usesGhl ? (
              <div className="text-xs text-muted-foreground">Configure in Omniply section above</div>
            ) : (
              <div className="text-xs text-muted-foreground">Not connected</div>
            )}
          </div>
        </div>
        {usesGhl ? (
          <span className="text-xs text-muted-foreground">Managed via Omniply</span>
        ) : platform === 'linkedin' && !isConnected ? (
          // Show two buttons for LinkedIn: Personal Profile and Company Page
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleConnect('personal')}
              disabled={isConnecting[`${platform}-personal`] || isConnecting[platform]}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isConnecting[`${platform}-personal`] || isConnecting[platform] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Personal Profile'
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConnect('company')}
              disabled={isConnecting[`${platform}-company`] || isConnecting[platform]}
            >
              {isConnecting[`${platform}-company`] || isConnecting[platform] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Company Page'
              )}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            {isConnected && platform === 'instagram' && (!connection?.platformUsername || connection?.platformUsername === 'Instagram User') && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!connection?.id) return

                  setIsRefreshingUsername(prev => ({ ...prev, [platform]: true }))
                  try {
                    const response = await fetch('/api/social/instagram/refresh-username', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        connectionId: connection.id,
                      }),
                    })

                    const data = await response.json()

                    if (data.success && data.username) {
                      toast.success(`Username updated to @${data.username}`)
                      // Refresh connections to update UI
                      await fetchConnections()
                    } else {
                      // Show warning instead of error - this is a known limitation
                      toast.warning(data.error || 'Could not fetch username. It will be fetched automatically when you publish your first Instagram post.')
                    }
                  } catch (error) {
                    console.error('Error refreshing Instagram username:', error)
                    toast.error('Failed to refresh username')
                  } finally {
                    setIsRefreshingUsername(prev => ({ ...prev, [platform]: false }))
                  }
                }}
                disabled={isRefreshingUsername[platform]}
                className="text-xs"
              >
                {isRefreshingUsername[platform] ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  'Refresh Username'
                )}
              </Button>
            )}
            <Button
              variant={isConnected ? 'outline' : 'default'}
              size="sm"
              onClick={isConnected ? handleDisconnect : () => handleConnect()}
              disabled={isDisconnectingPlatform || isConnecting[platform]}
              className={isConnected ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
            >
              {isDisconnectingPlatform ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Disconnecting...
                </>
              ) : isConnecting[platform] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                isConnected ? 'Disconnect' : 'Connect'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Page/Profile Selector for LinkedIn and Facebook */}
      {showPageSelector && (
        <div className="ml-14 space-y-2 p-3 rounded-lg border border-border bg-muted/30">
          <div className="text-sm font-medium text-card-foreground mb-2">Post Target</div>
          <div className="flex gap-2 mb-2">
            <Button
              variant={currentPostTargetType === 'personal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setPostTargetTypes(prev => ({ ...prev, [platform]: 'personal' }))
                updatePostTargetSettings(platform, 'personal')
              }}
              className={currentPostTargetType === 'personal' ? 'bg-primary text-primary-foreground' : ''}
            >
              Personal Profile
            </Button>
            <Button
              variant={currentPostTargetType === 'page' ? 'default' : 'outline'}
              size="sm"
              onClick={async () => {
                setPostTargetTypes(prev => ({ ...prev, [platform]: 'page' }))

                // Fetch pages if not already loaded (force refresh if user explicitly clicks)
                let pagesToUse = pages
                if (!isLoadingPagesForPlatform && pages.length === 0) {
                  console.log(`[Settings] Fetching pages for ${platform}...`)
                  pagesToUse = await fetchPages(platform, true) // Force refresh when user clicks
                }

                // Auto-select first page if pages are available and none selected
                if (pagesToUse.length > 0) {
                  const pageIdToUse = currentSelectedPageId || pagesToUse[0].id
                  setSelectedPageIds(prev => ({ ...prev, [platform]: pageIdToUse }))
                  updatePostTargetSettings(platform, 'page', pageIdToUse)
                } else {
                  // No pages found, just set target type
                  updatePostTargetSettings(platform, 'page')
                }
              }}
              className={currentPostTargetType === 'page' ? 'bg-primary text-primary-foreground' : ''}
            >
              Business Page
            </Button>
          </div>

          {currentPostTargetType === 'page' && (
            <div className="space-y-2">
              {isLoadingPagesForPlatform ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading pages...
                </div>
              ) : pages.length === 0 ? (
                <div className="text-sm text-muted-foreground space-y-2">
                  <div>No pages found.</div>
                  {platform === 'linkedin' ? (
                    <div className="text-xs">
                      LinkedIn Company Pages require the &quot;Community Management API&quot; product approval (MDP was deprecated April 2024). This requires a separate LinkedIn app. You can still post to your personal profile.
                    </div>
                  ) : (
                    <div className="text-xs space-y-1">
                      <div>Make sure you have admin access to at least one Facebook Page.</div>
                      {currentSelectedPageId && (
                        <div className="text-card-foreground">
                          Saved Page ID: <code>{currentSelectedPageId}</code> (stored in the database and still used for publishing).
                        </div>
                      )}
                      {rateLimitActive && (
                        <div className="text-amber-600">
                          Facebook API rate limit is active. Retry in approximately {Math.max(1, Math.ceil(rateLimitRemainingMs / 60000))} minute(s), or click &quot;Retry page fetch&quot; below once it clears.
                        </div>
                      )}
                    </div>
                  )}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoadingPagesForPlatform}
                      onClick={async () => {
                        await fetchPages(platform, true)
                      }}
                    >
                      {isLoadingPagesForPlatform ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        'Retry page fetch'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <select
                  value={currentSelectedPageId}
                  onChange={(e) => {
                    const pageId = e.target.value
                    setSelectedPageIds(prev => ({ ...prev, [platform]: pageId }))
                    updatePostTargetSettings(platform, 'page', pageId)
                  }}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a page...</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
