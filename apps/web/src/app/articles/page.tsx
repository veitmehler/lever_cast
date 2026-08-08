import type { Metadata } from 'next'
import { SiteHeader, Section, H2, P, MarketingFooter, TOKENS } from '@/components/marketing/Marketing'

export const revalidate = 300

const DO_API_BASE = process.env.DO_API_BASE ?? 'https://svc.omniply.io'

export const metadata: Metadata = {
  title: 'Articles... Omniply',
  description: 'Essays on practice marketing, written and published by the same engine Omniply customers get.',
}

interface ArticleCard {
  slug: string
  title: string
  excerpt: string | null
  readingTime: number | null
  publishedAt: string
  featuredImage: string | null
}

async function fetchArticles(): Promise<ArticleCard[]> {
  try {
    const res = await fetch(`${DO_API_BASE}/api/articles-public?limit=50`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = (await res.json()) as { articles: ArticleCard[] }
    return data.articles ?? []
  } catch {
    return []
  }
}

export default async function ArticlesIndexPage() {
  const articles = await fetchArticles()
  return (
    <main>
      <SiteHeader />
      <Section dark>
        <H2>Essays from the engine room.</H2>
        <P lead>
          Every article here was researched, written, illustrated, and published by the same engine our
          customers get. We do not just sell the autopilot... we fly it. Judge us by the output.
        </P>
        <div className="mt-10 space-y-8">
          {articles.length === 0 && <P>First essays landing shortly.</P>}
          {articles.map((a) => (
            <a
              key={a.slug}
              href={`/articles/${a.slug}`}
              className="block rounded-2xl p-6 transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="flex items-start gap-5">
                {a.featuredImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.featuredImage}
                    alt=""
                    className="hidden h-24 w-36 flex-shrink-0 rounded-lg object-cover md:block"
                  />
                )}
                <div>
                  <div className="text-xl font-bold" style={{ color: '#fff' }}>{a.title}</div>
                  {a.excerpt && <p className="mt-2 text-[16px] opacity-75">{a.excerpt}</p>}
                  <div className="mt-3 text-sm" style={{ color: TOKENS.lime }}>
                    {new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {a.readingTime ? ` · ${a.readingTime} min read` : ''}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </Section>
      <MarketingFooter />
    </main>
  )
}
