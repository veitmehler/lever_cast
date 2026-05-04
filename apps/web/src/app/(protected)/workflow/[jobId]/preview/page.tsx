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

async function getPreviewData(jobId: string, token: string): Promise<ArticlePreviewData | null> {
  const res = await fetch(`${API_URL}/api/articles/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  const sp = data.job?.sitePage
  if (!sp) return null
  return {
    title: sp.seoTitle ?? sp.title ?? data.job?.topic?.idea ?? 'Article Preview',
    seoTitle: sp.seoTitle ?? sp.title ?? '',
    seoDescription: sp.seoDescription ?? '',
    slug: sp.slug ?? '',
    excerpt: sp.excerpt ?? '',
    disclaimer: sp.disclaimer ?? '',
    primaryKeyword: sp.primaryKeyword ?? '',
    readingTime: sp.readingTime,
    bodyHtml: sp.bodyHtml ?? '',
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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Google snippet preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 font-sans">
          <div className="text-xs text-green-700 mb-1 truncate">
            {data.slug || 'your-site.com/article-slug'}
          </div>
          <div className="text-lg font-semibold text-blue-800 leading-tight mb-1">
            {data.seoTitle}
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">{data.seoDescription}</div>
        </div>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-4">{data.title}</h1>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-6">
              {data.readingTime && <span>{data.readingTime} min read</span>}
              {data.primaryKeyword && (
                <span className="bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {data.primaryKeyword}
                </span>
              )}
            </div>

            {/* Excerpt */}
            {data.excerpt && (
              <p className="text-lg text-gray-600 italic border-l-4 border-indigo-200 pl-4 mb-8 leading-relaxed">
                {data.excerpt}
              </p>
            )}

            {/* Article body */}
            <div
              className="prose prose-gray max-w-none
                prose-h2:text-xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-3
                prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
                prose-figure:my-6 prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-gray-500
                prose-img:rounded-lg prose-img:shadow-sm prose-img:w-full"
              dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
            />

            {/* Diagrams strip */}
            {data.diagrams && data.diagrams.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Diagrams
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.diagrams
                    .filter((d) => d.cdnUrl)
                    .map((d) => (
                      <figure key={d.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                          <Image
                            src={d.cdnUrl!}
                            alt={d.caption ?? d.sectionTitle}
                            fill
                            className="object-contain p-2 bg-white"
                            sizes="(max-width: 640px) 100vw, 50vw"
                          />
                        </div>
                        <figcaption className="text-xs text-gray-500 text-center px-2 py-1.5 bg-gray-50">
                          {d.position}. {d.caption ?? d.sectionTitle}
                        </figcaption>
                      </figure>
                    ))}
                </div>
              </div>
            )}

            {/* Citations */}
            {validCitations.length > 0 && (
              <section className="mt-10 border-t border-gray-100 pt-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  References
                </h2>
                <ol className="space-y-1.5 list-decimal pl-5">
                  {validCitations.map((c, i) => (
                    <li key={i} className="text-sm text-gray-600">
                      <a
                        href={c.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
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
              <footer className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-500 leading-relaxed">
                {data.disclaimer}
              </footer>
            )}
          </div>
        </article>

        {/* Back link */}
        <div className="mt-6 text-center">
          <a
            href={`/workflow/${jobId}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to job
          </a>
        </div>
      </div>
    </div>
  )
}
