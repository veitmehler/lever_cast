'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { BarChart3, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PostAnalytics {
  id: string
  platform: string
  content: string
  publishedAt: string | null
  postUrl: string | null
  comments: number
  totalReactions: number
  positiveReactions: number
  negativeReactions: number
  shares: number
  analyticsLastSyncedAt: string | null
}

export default function AnalyticsPage() {
  const { user } = useUser()
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.posts || [])
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Trigger analytics sync
      await fetch('/api/posts/sync-analytics')
      // Wait a bit for sync to complete, then refresh
      setTimeout(() => {
        fetchAnalytics()
        setIsRefreshing(false)
      }, 2000)
    } catch (error) {
      console.error('Error refreshing analytics:', error)
      setIsRefreshing(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return <span className="text-[#0A66C2] font-bold">in</span>
      case 'twitter':
      case 'x':
        return <span className="text-[#1DA1F2] font-bold">𝕏</span>
      case 'facebook':
        return <span className="text-[#1877F2] font-bold">f</span>
      case 'instagram':
        return <span className="text-[#E4405F] font-bold">ig</span>
      case 'threads':
        return <span className="text-black dark:text-white font-bold">th</span>
      case 'telegram':
        return <span className="text-[#0088cc] font-bold">✈</span>
      default:
        return platform.charAt(0).toUpperCase()
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance metrics for all your published posts
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Refresh Analytics
            </>
          )}
        </Button>
      </div>

      {/* Analytics Table */}
      {analytics.length === 0 ? (
        <div className="text-center py-12 rounded-lg border border-border bg-card">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No analytics data</h3>
          <p className="text-muted-foreground mb-4">
            Published posts will appear here once analytics are synced.
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Sync Analytics
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Post
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Reactions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Positive
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Negative
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Published
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm text-foreground font-medium mb-1">
                          {truncateContent(post.content)}
                        </p>
                        {post.postUrl && (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View Post →
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                          {getPlatformIcon(post.platform)}
                        </div>
                        <span className="text-sm font-medium text-foreground capitalize">
                          {post.platform}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-foreground">
                        {post.comments.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-foreground">
                        {post.totalReactions.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {post.positiveReactions.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        {post.negativeReactions.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-medium text-foreground">
                        {post.shares.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(post.publishedAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

