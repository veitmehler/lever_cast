import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SiteHeader, MarketingFooter, TOKENS } from '@/components/marketing/Marketing'
import '../../article-typography.css'

export const revalidate = 300

const DO_API_BASE = process.env.DO_API_BASE ?? 'https://svc.omniply.io'
const PUBLIC_BASE = 'https://omniply.io'

interface PublicArticle {
  slug: string
  title: string
  seoTitle: string
  seoDescription: string
  excerpt: string | null
  bodyHtml: string
  disclaimer: string | null
  schemaJson: string | null
  readingTime: number | null
  publishedAt: string
  featuredImage: { url: string; width: number | null; height: number | null; alt: string } | null
}

async function fetchArticle(slug: string): Promise<PublicArticle | null> {
  try {
    const res = await fetch(`${DO_API_BASE}/api/articles-public/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return (await res.json()) as PublicArticle
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = await fetchArticle(slug)
  if (!article) return { title: 'Article not found... Omniply' }
  return {
    title: `${article.seoTitle}... Omniply`,
    description: article.seoDescription,
    alternates: { canonical: `${PUBLIC_BASE}/articles/${article.slug}` },
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      type: 'article',
      url: `${PUBLIC_BASE}/articles/${article.slug}`,
      publishedTime: article.publishedAt,
      ...(article.featuredImage ? { images: [{ url: article.featuredImage.url, alt: article.featuredImage.alt }] } : {}),
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await fetchArticle(slug)
  if (!article) notFound()

  return (
    <main
      style={
        {
          background: '#fff',
          // .article-body colors itself with the app-theme vars — define them
          // here so marketing pages render dark-on-light regardless of the
          // app globals (this was white-on-white before).
          '--card-foreground': '#1C2B36',
          '--border': '#E2E7EB',
          '--muted-foreground': '#55636E',
          '--card': '#F4F7F9',
          '--muted': '#EDF1F4',
          '--primary': '#5F8A14',
        } as React.CSSProperties
      }
    >
      <SiteHeader />
      <article className="mx-auto w-full max-w-[1024px] px-5 py-14 md:px-8">
        <div className="mb-2 text-sm font-bold uppercase tracking-[0.16em]" style={{ color: TOKENS.accentDeep }}>
          Omniply Essays
        </div>
        <h1 className="mb-4 text-4xl font-bold leading-tight" style={{ color: TOKENS.ink, textWrap: 'balance' } as React.CSSProperties}>
          {article.title}
        </h1>
        <div className="mb-8 text-sm" style={{ color: TOKENS.muted }}>
          {new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          {article.readingTime ? ` · ${article.readingTime} min read` : ''} · by the Omniply content engine, reviewed by a human
        </div>
        {article.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.featuredImage.url}
            alt={article.featuredImage.alt}
            className="mb-10 w-full rounded-2xl"
          />
        )}
        <div className="article-body" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
        {article.disclaimer && (
          <p className="mt-12 border-t pt-6 text-sm italic" style={{ color: TOKENS.muted, borderColor: TOKENS.line }}>
            {article.disclaimer}
          </p>
        )}
      </article>
      {article.schemaJson && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: article.schemaJson }} />
      )}
      <MarketingFooter />
    </main>
  )
}
