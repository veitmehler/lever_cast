'use client'

import { FileText } from 'lucide-react'
import Link from 'next/link'

type Post = {
  id: string
  platform: string
  status: string
  content: string
  publishedAt: string | null
  scheduledAt: string | null
  draftId: string | null
  draft?: {
    id: string
    title: string
  }
}

interface CalendarDayViewProps {
  // date and onPostClick are reserved for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  date: Date
  posts: Post[]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPostClick?: (post: Post) => void
}

export function CalendarDayView({ posts }: CalendarDayViewProps) {
  const publishedPosts = posts.filter(p => p.status === 'published')
  const scheduledPosts = posts.filter(p => p.status === 'scheduled')

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">No posts for this date</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {publishedPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Published ({publishedPosts.length})
          </h3>
          <div className="space-y-2">
            {publishedPosts.map((post) => (
              <Link
                key={post.id}
                href={post.draftId ? `/posts/${post.draftId}` : '#'}
                className="block rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {post.platform}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-card-foreground line-clamp-2">
                  {post.content}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {scheduledPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Scheduled ({scheduledPosts.length})
          </h3>
          <div className="space-y-2">
            {scheduledPosts.map((post) => (
              <Link
                key={post.id}
                href={post.draftId ? `/posts/${post.draftId}` : '#'}
                className="block rounded-lg border border-border bg-card p-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {post.platform}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {post.scheduledAt
                      ? new Date(post.scheduledAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="text-sm text-card-foreground line-clamp-2">
                  {post.content}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

