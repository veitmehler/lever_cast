import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'

const API_URL = process.env.DO_API_BASE ?? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.socioply.com'

interface ArticlePreviewData {
  title: string
  seoTitle: string
  seoDescription: string
  slug: string
  excerpt: string
  disclaimer: string
  primaryKeyword: string
  readingTime?: number | null
  bodyHtml: string
  citations: Array<{ link_title: string; link_url: string }>
  featuredImage?: { url: string; altText?: string | null } | null
  diagrams?: Array<{
    id: string
    position: number
    sectionTitle: string
    caption?: string | null
    cdnUrl?: string | null
  }>
}

type RawStep = { stepNumber: number; status: string; output?: string | null }

/** Resolve the best available article body from the API response.
 *  Priority: sitePage.bodyHtml → step 11 output → step 9 output */
function resolveBodyHtml(sp: Record<string, unknown>, steps: RawStep[]): string {
  if (sp.bodyHtml && typeof sp.bodyHtml === 'string' && sp.bodyHtml.trim()) {
    return sp.bodyHtml
  }
  // Fall back to step output directly from pipelineSteps
  const completed = steps.filter((s) => s.status === 'completed')
  const step11 = completed.find((s) => s.stepNumber === 11)
  if (step11?.output?.trim()) return step11.output
  const step9 = completed.find((s) => s.stepNumber === 9)
  if (step9?.output?.trim()) return step9.output
  return ''
}

async function getPreviewData(jobId: string, token: string): Promise<ArticlePreviewData | null> {
  const res = await fetch(`${API_URL}/api/articles/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  const job = data.job
  const sp = job?.sitePage
  if (!sp) return null

  const steps: RawStep[] = job?.pipelineSteps ?? []
  const bodyHtml = resolveBodyHtml(sp as Record<string, unknown>, steps)

  return {
    title: sp.seoTitle ?? sp.title ?? job?.topic?.topic ?? 'Article Preview',
    seoTitle: sp.seoTitle ?? sp.title ?? '',
    seoDescription: sp.seoDescription ?? '',
    slug: sp.slug ?? '',
    excerpt: sp.excerpt ?? '',
    disclaimer: sp.disclaimer ?? '',
    primaryKeyword: sp.primaryKeyword ?? '',
    readingTime: sp.readingTime,
    bodyHtml,
    citations: (() => {
      const raw = sp.citations
      if (!raw) return []
      if (Array.isArray(raw)) return raw.map((c: { link_title?: string; link_url?: string; title?: string; url?: string }) => ({
        link_title: c.link_title ?? c.title ?? '',
        link_url: c.link_url ?? c.url ?? '',
      }))
      if (Array.isArray(raw.resource_links)) return raw.resource_links.map((c: { link_title?: string; link_url?: string }) => ({
        link_title: c.link_title ?? '',
        link_url: c.link_url ?? '',
      }))
      return []
    })(),
    featuredImage: sp.featuredImage,
    diagrams: sp.diagrams,
  }
}

export default async function ArticlePreviewPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { getToken } = await auth()
  const token = await getToken()
  if (!token) redirect('/sign-in')

  const { jobId } = await params
  const data = await getPreviewData(jobId, token)
  if (!data) notFound()

  const validCitations = data.citations.filter((c) => c.link_url)

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Google snippet preview */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8 font-sans">
          <div className="text-xs text-green-700 dark:text-green-400 mb-1 truncate">
            {data.slug || 'your-site.com/article-slug'}
          </div>
          <div className="text-lg font-semibold text-blue-800 dark:text-blue-200 leading-tight mb-1">
            {data.seoTitle}
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">{data.seoDescription}</div>
        </div>

        <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          {/* Featured image */}
          {data.featuredImage?.url && (
            <div className="relative w-full" style={{ paddingTop: '52%' }}>
              <Image
                src={data.featuredImage.url}
                alt={data.featuredImage.altText ?? data.title}
                fill
                className="object-cover"
                sizes="(max-width: 800px) 100vw, 768px"
                priority
              />
            </div>
          )}

          <div className="px-8 py-10">
            <h1 className="text-3xl font-bold text-card-foreground leading-tight mb-4">{data.title}</h1>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-6">
              {data.readingTime && <span>{data.readingTime} min read</span>}
              {data.primaryKeyword && (
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {data.primaryKeyword}
                </span>
              )}
            </div>

            {/* Excerpt */}
            {data.excerpt && (
              <p className="text-lg text-muted-foreground italic border-l-4 border-primary/40 pl-4 mb-8 leading-relaxed">
                {data.excerpt}
              </p>
            )}

            {/* Article body */}
            {data.bodyHtml ? (
              <div
                className="prose prose-neutral dark:prose-invert max-w-none
                  prose-headings:font-bold
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:w-full
                  prose-figcaption:text-center"
                dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
              />
            ) : (
              <p className="text-muted-foreground italic text-sm">
                Article body not yet available — the approval chain may still be running, or step 11 produced no output.
              </p>
            )}

            {/* Diagrams strip */}
            {data.diagrams && data.diagrams.length > 0 && (
              <div className="mt-8 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Diagrams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.diagrams
                    .filter((d) => d.cdnUrl)
                    .map((d) => (
                      <figure key={d.id} className="border border-border rounded-xl overflow-hidden">
                        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                          <Image
                            src={d.cdnUrl!}
                            alt={d.caption ?? d.sectionTitle}
                            fill
                            className="object-contain p-2"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        </div>
                        <figcaption className="text-xs text-muted-foreground text-center px-2 py-1.5 bg-muted">
                          {d.position}. {d.caption ?? d.sectionTitle}
                        </figcaption>
                      </figure>
                    ))}
                </div>
              </div>
            )}

            {/* Citations */}
            {validCitations.length > 0 && (
              <section className="mt-10 border-t border-border pt-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  References
                </h2>
                <ol className="space-y-1.5 list-decimal pl-5">
                  {validCitations.map((c, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      <a
                        href={c.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {c.link_title || c.link_url}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Disclaimer */}
            {data.disclaimer && (
              <footer className="mt-8 bg-muted border border-border rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
                {data.disclaimer}
              </footer>
            )}
          </div>
        </article>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href={`/workflow/${jobId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to job
          </a>
        </div>
      </div>
    </div>
  )
}
