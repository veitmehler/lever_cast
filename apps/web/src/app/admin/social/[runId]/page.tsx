import { prisma } from '@omniply/shared'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-400',
  published: 'bg-green-500/20 text-green-400',
}

function parseAssetsSummary(assetsJson: unknown): string {
  if (!assetsJson || typeof assetsJson !== 'object') return '—'
  const o = assetsJson as Record<string, unknown>
  const postType = String(o.postType ?? '')
  if (typeof o.videoUrl === 'string' && o.videoUrl) return `video (${postType})`
  if (Array.isArray(o.mediaUrls) && o.mediaUrls.length > 1) return `carousel (${postType})`
  if (o.imageUrl || (Array.isArray(o.mediaUrls) && o.mediaUrls.length > 0)) {
    return `image (${postType})`
  }
  return postType || '—'
}

function formatDateTime(d: Date | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString()
}

export default async function SocialRunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params

  const run = await prisma.socialAutomationRun.findUnique({
    where: { id: runId },
    include: {
      user: { select: { email: true, name: true } },
      job: { include: { topic: { select: { topic: true, mode: true } } } },
      sitePage: { select: { title: true, slug: true, primaryKeyword: true } },
      specResults: { orderBy: { slotKey: 'asc' } },
      posts: {
        orderBy: [{ slotKey: 'asc' }, { platform: 'asc' }],
        select: {
          id: true,
          platform: true,
          status: true,
          postUrl: true,
          slotKey: true,
          scheduledAt: true,
          publishedAt: true,
          postType: true,
          provider: true,
          errorMsg: true,
        },
      },
    },
  })

  if (!run) notFound()

  const articleTitle = run.job?.topic?.topic ?? run.sitePage?.title ?? '—'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/social"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to social runs
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automation Run</h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">{run.id}</p>
          </div>
          <span
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              STATUS_COLORS[run.status] ?? STATUS_COLORS.pending
            }`}
          >
            {run.status}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">User</p>
          <p className="mt-0.5 text-foreground">{run.user.email}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Scheduled date</p>
          <p className="mt-0.5 text-foreground">{run.scheduledDate}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Specs</p>
          <p className="mt-0.5 text-foreground">
            {run.completedSpecs}/{run.totalSpecs} completed
            {run.failedSpecs > 0 && (
              <span className="text-red-400"> · {run.failedSpecs} failed</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Article</p>
          {run.jobId ? (
            <Link href={`/admin/articles/${run.jobId}`} className="mt-0.5 text-primary hover:underline block">
              {articleTitle}
            </Link>
          ) : (
            <p className="mt-0.5 text-foreground">{articleTitle}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="mt-0.5 text-foreground">{formatDateTime(run.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Updated</p>
          <p className="mt-0.5 text-foreground">{formatDateTime(run.updatedAt)}</p>
        </div>
        {run.currentSpec && (
          <div>
            <p className="text-xs text-muted-foreground">Current spec</p>
            <p className="mt-0.5 text-foreground font-mono">{run.currentSpec}</p>
          </div>
        )}
        {run.error && (
          <div className="md:col-span-2 lg:col-span-3">
            <p className="text-xs text-muted-foreground">Run error</p>
            <p className="mt-0.5 text-red-400 text-sm">{run.error}</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Spec results</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {run.specResults.map((sr) => (
            <div key={sr.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-medium text-foreground">{sr.slotKey}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    STATUS_COLORS[sr.status] ?? STATUS_COLORS.pending
                  }`}
                >
                  {sr.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Posts created: {sr.postsCreated}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assets: {parseAssetsSummary(sr.assetsJson)}
              </p>
              {sr.error && (
                <p className="mt-2 text-xs text-red-400 line-clamp-3" title={sr.error}>
                  {sr.error}
                </p>
              )}
            </div>
          ))}
          {run.specResults.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-full">No spec results yet</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Posts ({run.posts.length})
        </h2>
        {run.posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts created for this run</p>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Slot</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Scheduled</th>
                    <th className="px-4 py-3 font-medium">Post URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {run.posts.map((post) => (
                    <tr key={post.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{post.slotKey ?? '—'}</td>
                      <td className="px-4 py-3 capitalize">{post.platform}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[post.status] ?? STATUS_COLORS.pending
                          }`}
                        >
                          {post.status}
                        </span>
                        {post.errorMsg && (
                          <p className="mt-1 text-xs text-red-400 line-clamp-1" title={post.errorMsg}>
                            {post.errorMsg}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDateTime(post.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        {post.postUrl ? (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate block"
                          >
                            {post.postUrl}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
