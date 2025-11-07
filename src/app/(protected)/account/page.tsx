'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Mail, Calendar, Shield, Loader2 } from 'lucide-react'

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  const [stats, setStats] = useState({ postsCreated: 0, postsPublished: 0 })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  
  // Load stats from database APIs
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true)
        
        // Fetch drafts and posts in parallel
        const [draftsResponse, postsResponse] = await Promise.all([
          fetch('/api/drafts'),
          fetch('/api/posts'),
        ])

        let postsCreated = 0
        let postsPublished = 0

        if (draftsResponse.ok) {
          const drafts = await draftsResponse.json()
          postsCreated = drafts.length
        }

        if (postsResponse.ok) {
          const posts = await postsResponse.json()
          postsPublished = posts.filter((p: { status: string }) => p.status === 'published').length
        }

        setStats({
          postsCreated,
          postsPublished,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoadingStats(false)
      }
    }

    if (isLoaded) {
      fetchStats()
    }
  }, [isLoaded])
  
  if (!isLoaded) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const userName = user?.fullName || user?.firstName || 'User'
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'No email'
  const joinedDate = user?.createdAt ? new Date(user.createdAt) : new Date()
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Account</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-6">Profile</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={userName}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-bold">
                  {userName.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-medium text-card-foreground">{userName}</div>
                <div className="text-sm text-muted-foreground">Free Plan</div>
              </div>
            </div>

            <div className="grid gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="text-card-foreground">{userEmail}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="text-card-foreground">
                    {joinedDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Account Security</div>
                  <div className="text-card-foreground">Managed by Clerk</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Usage Statistics</h2>
          
          {isLoadingStats ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-secondary p-4">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stats.postsCreated}
                </div>
                <div className="text-sm text-muted-foreground">Posts Created</div>
              </div>

              <div className="rounded-lg bg-secondary p-4">
                <div className="text-3xl font-bold text-foreground mb-1">
                  {stats.postsPublished}
                </div>
                <div className="text-sm text-muted-foreground">Posts Published</div>
              </div>
            </div>
          )}
        </div>

        {/* Subscription Info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">Subscription</h2>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
            <div>
              <div className="font-medium text-card-foreground mb-1">Free Plan</div>
              <div className="text-sm text-muted-foreground">
                Limited features • Upgrade for unlimited access
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

