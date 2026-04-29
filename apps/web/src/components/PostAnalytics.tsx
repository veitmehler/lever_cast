'use client'

import { useState } from 'react'
import { BarChart3, Eye, Heart, MessageCircle, Share2, TrendingUp, Clock, AlertCircle } from 'lucide-react'

// Analytics data types
type TwitterAnalytics = {
  impressions?: number
  likes?: number
  retweets?: number
  replies?: number
  quoteTweets?: number
  views?: number
}

type LinkedInAnalytics = {
  impressions?: number
  clicks?: number
  likes?: number
  comments?: number
  shares?: number
}

type AnalyticsData = TwitterAnalytics | LinkedInAnalytics | null

interface PostAnalyticsProps {
  platform: 'twitter' | 'linkedin'
  analytics: AnalyticsData
  lastSyncedAt: Date | null
  postId: string // Post ID for single-post refresh
  onRefresh?: () => void // Callback after refresh completes
}

export function PostAnalytics({ platform, analytics, lastSyncedAt, postId, onRefresh }: PostAnalyticsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRefresh = async () => {
    if (!postId || isRefreshing) return
    
    setIsRefreshing(true)
    setErrorMessage(null)
    
    try {
      const response = await fetch(`/api/posts/${postId}/sync-analytics`, {
        method: 'POST',
      })
      
      interface SyncAnalyticsResult {
        success?: boolean
        error?: string
        message?: string
        [key: string]: unknown
      }

      // Parse JSON response (even for error responses)
      let result: SyncAnalyticsResult = {}
      try {
        result = await response.json() as SyncAnalyticsResult
      } catch {
        // If JSON parsing fails, use the status text
        result = { message: response.statusText || 'Unknown error' }
      }
      
      if (response.ok && result.success) {
        // Success - call the refresh callback to update the parent component
        if (onRefresh) {
          onRefresh()
        }
        // Clear any previous error messages
        setErrorMessage(null)
      } else {
        // Handle error response
        if (result.error === 'permissions_required' || response.status === 403) {
          setErrorMessage((result.details || result.message || 'LinkedIn analytics requires additional permissions. Please reconnect your LinkedIn account.') as string)
        } else {
          setErrorMessage((result.message || 'Failed to refresh analytics') as string)
        }
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      setErrorMessage('Failed to refresh analytics. Please try again.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!analytics) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </h3>
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Synced {new Date(lastSyncedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        {errorMessage ? (
          <div className="mt-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium mb-1">Permission Required</p>
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
                {platform === 'linkedin' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    LinkedIn analytics is currently unavailable. LinkedIn has restricted access to analytics. Please check on LinkedIn directly.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {platform === 'linkedin' 
              ? 'LinkedIn analytics is currently unavailable. LinkedIn has restricted access to analytics. Please check on LinkedIn directly.'
              : 'Analytics data not available yet. Analytics are synced daily at 2 AM UTC.'}
          </p>
        )}
        {postId && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-2 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh now'}
          </button>
        )}
      </div>
    )
  }

  if (platform === 'twitter') {
    const twitterAnalytics = analytics as TwitterAnalytics
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Twitter Analytics
          </h3>
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lastSyncedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {twitterAnalytics.impressions !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {twitterAnalytics.impressions.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Impressions</div>
              </div>
            </div>
          )}
          {twitterAnalytics.views !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {twitterAnalytics.views.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
            </div>
          )}
          {twitterAnalytics.likes !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary">
              <Heart className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {twitterAnalytics.likes.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
            </div>
          )}
          {twitterAnalytics.retweets !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {twitterAnalytics.retweets.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Retweets</div>
              </div>
            </div>
          )}
          {twitterAnalytics.replies !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {twitterAnalytics.replies.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Replies</div>
              </div>
            </div>
          )}
          {twitterAnalytics.quoteTweets !== undefined && (
            <div className="flex items-center gap-2 p-2 rounded bg-secondary">
              <Share2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-lg font-semibold text-foreground">
                  {twitterAnalytics.quoteTweets.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Quote Tweets</div>
              </div>
            </div>
          )}
        </div>
        {errorMessage && (
          <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium mb-1">Permission Required</p>
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        {postId && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="mt-3 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh analytics'}
          </button>
        )}
      </div>
    )
  }

  // LinkedIn analytics
  const linkedInAnalytics = analytics as LinkedInAnalytics
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          LinkedIn Analytics
        </h3>
        {lastSyncedAt && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(lastSyncedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {linkedInAnalytics.impressions !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-secondary">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold text-foreground">
                {linkedInAnalytics.impressions.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Impressions</div>
            </div>
          </div>
        )}
        {linkedInAnalytics.clicks !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-secondary">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold text-foreground">
                {linkedInAnalytics.clicks.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Clicks</div>
            </div>
          </div>
        )}
        {linkedInAnalytics.likes !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-secondary">
            <Heart className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold text-foreground">
                {linkedInAnalytics.likes.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>
        )}
        {linkedInAnalytics.comments !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-secondary">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold text-foreground">
                {linkedInAnalytics.comments.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Comments</div>
            </div>
          </div>
        )}
        {linkedInAnalytics.shares !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded bg-secondary">
            <Share2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-semibold text-foreground">
                {linkedInAnalytics.shares.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Shares</div>
            </div>
          </div>
        )}
      </div>
      {errorMessage && (
        <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium mb-1">Permission Required</p>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
              {platform === 'linkedin' && (
                <p className="text-xs text-muted-foreground mt-2">
                  LinkedIn analytics is currently unavailable. LinkedIn has restricted access to analytics. Please check on LinkedIn directly.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {postId && (
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="mt-3 text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh analytics'}
        </button>
      )}
    </div>
  )
}

